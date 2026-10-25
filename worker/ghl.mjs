/**
 * Writes a seller submission into the GoHighLevel "Your Card Buyer" sub-account
 * (location x2TNpESH8cl6WVaA2Gru).
 *
 * Calls, in this order:
 *
 *   1. upsert the contact (GHL dedupes on email and phone)
 *   2. upload the photos into the contact's file-upload custom field, if one
 *      is configured (GHL_PHOTO_FIELD_ID)
 *   3. add a note holding the whole submission, including how many photos
 *      landed, so nothing depends on a field mapping
 *   4. add tags, last, because the GHL workflow triggers on "ycb-new-submission"
 *      and the photos and note should already be on the contact when it fires
 *   5. open an opportunity, only if GHL_PIPELINE_ID and GHL_STAGE_ID are set
 *
 * A failed photo upload does not fail the submission. The seller's details are
 * worth more than the photos, which can be asked for again; the note and the
 * "ycb-photos-failed" tag say what happened.
 *
 * UNVERIFIED against the live account. Endpoints and the Version header follow
 * HighLevel's API docs and the party boat receiver, which has itself only been
 * tested against a stub. The photo endpoint (POST /forms/upload-custom-files,
 * multipart, one part per file named "<customFieldId>_<fileId>") matches the
 * description HighLevel's own tool catalog gives for "upload to custom fields".
 * Confirm all of it with one real submission once the token exists.
 */

export const GHL_API_BASE = 'https://services.leadconnectorhq.com';
export const GHL_API_VERSION = '2021-07-28';

export const TAG_NEW = 'ycb-new-submission';
export const TAG_SUSPECTED_SPAM = 'ycb-spam-suspected';
export const TAG_BLOCKED_SPAM = 'ycb-spam-blocked';
export const TAG_SMS_YES = 'ycb-sms-consent-yes';
export const TAG_SMS_NO = 'ycb-sms-consent-no';
export const TAG_PHOTOS_FAILED = 'ycb-photos-failed';
export const kindTag = (kind) => `ycb-kind-${kind || 'unknown'}`;

const LABELS = {
  kind: 'Selling',
  count: 'About how many',
  sports: 'Sports',
  description: 'Description',
  asking: 'Price in mind',
  zip: 'ZIP',
  sms_consent: 'Texting allowed',
  page: 'Page',
};

const str = (value) => (typeof value === 'string' ? value.trim().slice(0, 4000) : '');

export function splitName(full) {
  const parts = str(full).split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) };
}

export function contactBody(fields, locationId, sourceSite) {
  const { firstName, lastName } = splitName(fields.name);
  const body = { locationId, source: `${sourceSite || 'yourcardbuyer.com'} offer form` };
  if (firstName) body.firstName = firstName;
  if (lastName) body.lastName = lastName;
  if (str(fields.email)) body.email = str(fields.email);
  if (str(fields.phone)) body.phone = str(fields.phone);
  if (str(fields.zip)) body.postalCode = str(fields.zip).slice(0, 10);
  return body;
}

export function noteBody(fields, { receivedAt, photos, spamReasons = [] }) {
  const lines = [`Card offer request, received ${receivedAt}`];
  for (const [key, label] of Object.entries(LABELS)) {
    const value = key === 'sms_consent' ? (str(fields[key]) === 'yes' ? 'yes' : 'no') : str(fields[key]);
    if (value) lines.push(`${label}: ${value}`);
  }
  lines.push(`Photos: ${photos.summary}`);
  if (spamReasons.length > 0) lines.push(`Spam signals: ${spamReasons.join(', ')}`);
  return lines.join('\n');
}

export function tagsFor(fields, { spam, discard }, { photosFailed = false } = {}) {
  if (discard) return [TAG_BLOCKED_SPAM];
  const tags = [TAG_NEW, kindTag(str(fields.kind)), str(fields.sms_consent) === 'yes' ? TAG_SMS_YES : TAG_SMS_NO];
  if (photosFailed) tags.push(TAG_PHOTOS_FAILED);
  if (spam) tags.push(TAG_SUSPECTED_SPAM);
  return tags;
}

/**
 * @returns {Promise<{ok: boolean, contactId?: string, photos?: 'ok'|'none'|'missing', step?: string, status?: number, detail?: string}>}
 */
export async function writeSubmission({
  fields, photos = [], dropped = [], token, locationId, photoFieldId, pipelineId, stageId,
  sourceSite, verdict, fetchImpl = fetch, now = new Date(), newId = () => crypto.randomUUID(),
}) {
  const auth = { authorization: `Bearer ${token}`, version: GHL_API_VERSION, accept: 'application/json' };
  const call = async (step, path, body) => {
    const response = await fetchImpl(`${GHL_API_BASE}${path}`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return { ok: false, step, status: response.status, detail };
    }
    return { ok: true, json: await response.json().catch(() => ({})) };
  };

  const upsert = await call('upsert', '/contacts/upsert', contactBody(fields, locationId, sourceSite));
  if (!upsert.ok) return upsert;
  const contactId = upsert.json?.contact?.id;
  if (!contactId) return { ok: false, step: 'upsert', status: 200, detail: 'no contact id in response' };

  /* Photos. Spam that scores as discard keeps its photos out of the account. */
  let photoState = photos.length === 0 ? 'none' : 'ok';
  let photoSummary = photos.length === 0 ? 'none sent' : `${photos.length} uploaded`;
  if (photos.length > 0 && verdict.discard) {
    photoState = 'none';
    photoSummary = `${photos.length} sent, not stored (blocked as spam)`;
  } else if (photos.length > 0 && !photoFieldId) {
    photoState = 'missing';
    photoSummary = `${photos.length} sent, not stored (no photo field configured on the site)`;
  } else if (photos.length > 0) {
    const data = new FormData();
    for (const file of photos) data.append(`${photoFieldId}_${newId()}`, file, file.name || 'photo.jpg');
    const qs = new URLSearchParams({ contactId, locationId });
    let failure = '';
    try {
      const response = await fetchImpl(`${GHL_API_BASE}/forms/upload-custom-files?${qs}`, {
        method: 'POST',
        headers: auth,
        body: data,
      });
      if (!response.ok) failure = `GHL ${response.status} ${(await response.text().catch(() => '')).slice(0, 200)}`;
    } catch (error) {
      failure = String(error?.message ?? error);
    }
    if (failure) {
      console.error('sell: photo upload failed', failure);
      photoState = 'missing';
      photoSummary = `${photos.length} sent, upload to GHL failed; ask the seller to send them again`;
    }
  }
  if (dropped.length > 0) photoSummary += `; ${dropped.length} left off (${dropped.join('; ')})`;

  const note = await call('note', `/contacts/${contactId}/notes`, {
    body: noteBody(fields, { receivedAt: now.toISOString(), photos: { summary: photoSummary }, spamReasons: verdict.reasons }),
  });
  if (!note.ok) return { ...note, contactId };

  const tags = await call('tags', `/contacts/${contactId}/tags`, {
    tags: tagsFor(fields, verdict, { photosFailed: photoState === 'missing' }),
  });
  if (!tags.ok) return { ...tags, contactId };

  if (pipelineId && stageId && !verdict.discard) {
    const name = [str(fields.name) || 'Seller', str(fields.kind)].filter(Boolean).join(', ');
    const opp = await call('opportunity', '/opportunities/', {
      pipelineId, pipelineStageId: stageId, locationId, contactId, name, status: 'open',
    });
    /* An opportunity is a convenience. The contact, note and tags already hold everything. */
    if (!opp.ok) console.error(`sell: opportunity failed (${opp.status})`, opp.detail);
  }

  return { ok: true, contactId, photos: photoState };
}

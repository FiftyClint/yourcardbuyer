import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { receiveSubmission, canonicalLocation, choosePhotos } from './index.mjs';
import { spamScore } from './spam.mjs';
import { TAG_NEW, TAG_BLOCKED_SPAM, TAG_PHOTOS_FAILED, TAG_SMS_YES } from './ghl.mjs';

const ENV = { SITE_DOMAIN: 'yourcardbuyer.com', GHL_TOKEN: 't', GHL_LOCATION_ID: 'loc1', GHL_PHOTO_FIELD_ID: 'fld1' };

/** A stub GHL that records every call and answers like the real API. */
function stubGhl({ failPhotos = false, failStep = null } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const path = new URL(url).pathname;
    calls.push({ path, url, init });
    const step = path.includes('upload-custom-files') ? 'photos' : path.endsWith('/upsert') ? 'upsert' : path.endsWith('/notes') ? 'note' : path.endsWith('/tags') ? 'tags' : 'other';
    if ((step === 'photos' && failPhotos) || step === failStep) return new Response('nope', { status: 422 });
    if (step === 'upsert') return Response.json({ contact: { id: 'c123' } });
    return Response.json({ ok: true });
  };
  return { calls, fetchImpl };
}

function goodForm(extra = {}) {
  const f = new FormData();
  const base = {
    name: 'Pat Seller', email: 'pat@example.com', phone: '9135550100', kind: 'collection', count: '50-500',
    description: 'Binder of 1989 Upper Deck baseball', form_loaded_at: String(Date.now() - 60_000), client: 'script',
  };
  for (const [k, v] of Object.entries({ ...base, ...extra })) if (v != null) f.append(k, v);
  return f;
}

const post = (form, headers = { origin: 'https://yourcardbuyer.com' }) =>
  new Request('https://yourcardbuyer.com/api/sell', { method: 'POST', body: form, headers });

const photo = (name = 'card.jpg', bytes = 2048, type = 'image/jpeg') => new File([new Uint8Array(bytes)], name, { type });

test('writes contact, photos, note and tags in that order', async () => {
  const ghl = stubGhl();
  const form = goodForm({ sms_consent: 'yes' });
  form.append('sports', 'baseball');
  form.append('sports', 'football');
  form.append('photos', photo('front.jpg'));
  form.append('photos', photo('back.jpg'));
  const res = await receiveSubmission(post(form), ENV, { fetchImpl: ghl.fetchImpl });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, photos: 'ok' });
  assert.deepEqual(ghl.calls.map((c) => c.path), ['/contacts/upsert', '/forms/upload-custom-files', '/contacts/c123/notes', '/contacts/c123/tags']);

  const upload = ghl.calls[1];
  assert.match(upload.url, /contactId=c123/);
  assert.match(upload.url, /locationId=loc1/);
  const parts = [...upload.init.body.keys()];
  assert.equal(parts.length, 2);
  assert.ok(parts.every((k) => k.startsWith('fld1_')));

  const note = JSON.parse(ghl.calls[2].init.body).body;
  assert.match(note, /Sports: baseball, football/);
  assert.match(note, /Photos: 2 uploaded/);
  const tags = JSON.parse(ghl.calls[3].init.body).tags;
  assert.ok(tags.includes(TAG_NEW));
  assert.ok(tags.includes(TAG_SMS_YES));
  assert.ok(tags.includes('ycb-kind-collection'));
});

test('a failed photo upload still saves the seller and says photos are missing', async () => {
  const ghl = stubGhl({ failPhotos: true });
  const form = goodForm();
  form.append('photos', photo());
  const res = await receiveSubmission(post(form), ENV, { fetchImpl: ghl.fetchImpl });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, photos: 'missing' });
  const note = JSON.parse(ghl.calls.find((c) => c.path.endsWith('/notes')).init.body).body;
  assert.match(note, /upload to GHL failed/);
  const tags = JSON.parse(ghl.calls.find((c) => c.path.endsWith('/tags')).init.body).tags;
  assert.ok(tags.includes(TAG_PHOTOS_FAILED));
});

test('without a photo field the photos are reported missing, not silently lost', async () => {
  const ghl = stubGhl();
  const form = goodForm();
  form.append('photos', photo());
  const res = await receiveSubmission(post(form), { ...ENV, GHL_PHOTO_FIELD_ID: '' }, { fetchImpl: ghl.fetchImpl });
  assert.deepEqual(await res.json(), { ok: true, photos: 'missing' });
  assert.ok(!ghl.calls.some((c) => c.path.includes('upload-custom-files')));
});

test('no photos is fine', async () => {
  const ghl = stubGhl();
  const res = await receiveSubmission(post(goodForm()), ENV, { fetchImpl: ghl.fetchImpl });
  assert.deepEqual(await res.json(), { ok: true, photos: 'none' });
});

test('a plain form post redirects to the thank-you page', async () => {
  const ghl = stubGhl({ failPhotos: true });
  const form = goodForm({ client: null });
  form.append('photos', photo());
  const res = await receiveSubmission(post(form), ENV, { fetchImpl: ghl.fetchImpl });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/thank-you/?photos=missing');
});

test('refuses to pretend when GHL is not configured', async () => {
  const res = await receiveSubmission(post(goodForm()), { SITE_DOMAIN: 'yourcardbuyer.com' }, { fetchImpl: stubGhl().fetchImpl });
  assert.equal(res.status, 503);
});

test('a GHL failure tells the visitor it did not go through', async () => {
  const res = await receiveSubmission(post(goodForm()), ENV, { fetchImpl: stubGhl({ failStep: 'note' }).fetchImpl });
  assert.equal(res.status, 502);
});

test('no email or phone, nothing recorded', async () => {
  const ghl = stubGhl();
  const res = await receiveSubmission(post(goodForm({ email: '', phone: '' })), ENV, { fetchImpl: ghl.fetchImpl });
  assert.equal(res.status, 400);
  assert.equal(ghl.calls.length, 0);
});

test('obvious spam is stored under its own tag, without photos, and answered like a real one', async () => {
  const ghl = stubGhl();
  const form = goodForm({ website: 'http://spam', form_loaded_at: String(Date.now()) });
  form.append('photos', photo());
  const res = await receiveSubmission(post(form), ENV, { fetchImpl: ghl.fetchImpl });
  assert.deepEqual(await res.json(), { ok: true, photos: 'ok' });
  assert.ok(!ghl.calls.some((c) => c.path.includes('upload-custom-files')));
  const tags = JSON.parse(ghl.calls.find((c) => c.path.endsWith('/tags')).init.body).tags;
  assert.deepEqual(tags, [TAG_BLOCKED_SPAM]);
});

test('opens an opportunity only when a pipeline is configured', async () => {
  const ghl = stubGhl();
  await receiveSubmission(post(goodForm()), { ...ENV, GHL_PIPELINE_ID: 'p1', GHL_STAGE_ID: 's1' }, { fetchImpl: ghl.fetchImpl });
  const opp = ghl.calls.find((c) => c.path === '/opportunities/');
  assert.ok(opp);
  assert.equal(JSON.parse(opp.init.body).pipelineStageId, 's1');
});

test('photo limits: count, size, type', () => {
  const files = [photo('a.jpg'), new File(['x'], 'notes.txt', { type: 'text/plain' }), photo('big.jpg', 11 * 1024 * 1024)];
  for (let i = 0; i < 14; i++) files.push(photo(`p${i}.jpg`));
  const { keep, dropped } = choosePhotos(files);
  assert.equal(keep.length, 12);
  assert.ok(dropped.some((d) => d.includes('not a photo')));
  assert.ok(dropped.some((d) => d.includes('over 10 MB')));
  assert.ok(dropped.some((d) => d.includes('over 12 photos')));
});

test('a real seller does not score as spam', () => {
  const fields = { name: 'Pat Seller', kind: 'graded', count: 'unsure', description: 'Two PSA 9 slabs', form_loaded_at: String(Date.now() - 30_000) };
  const req = new Request('https://yourcardbuyer.com/api/sell', { method: 'POST', headers: { origin: 'https://yourcardbuyer.com' } });
  assert.equal(spamScore(fields, req, ['yourcardbuyer.com']).spam, false);
});

test('canonical redirects for pages, never for the form', () => {
  const env = { SITE_DOMAIN: 'yourcardbuyer.com' };
  assert.equal(canonicalLocation(new Request('http://www.yourcardbuyer.com/privacy'), env), 'https://yourcardbuyer.com/privacy/');
  assert.equal(canonicalLocation(new Request('https://yourcardbuyer.com/'), env), null);
  assert.equal(canonicalLocation(new Request('http://www.yourcardbuyer.com/api/sell', { method: 'POST' }), env), null);
});

test('unknown api paths 404 instead of serving a page', async () => {
  const res = await worker.fetch(new Request('https://yourcardbuyer.com/api/lead'), { SITE_DOMAIN: 'yourcardbuyer.com', ASSETS: { fetch: () => new Response('page') } });
  assert.equal(res.status, 404);
});

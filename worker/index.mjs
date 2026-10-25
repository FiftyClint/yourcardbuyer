import { spamScore } from './spam.mjs';
import { writeSubmission } from './ghl.mjs';
import { MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_TOTAL_BYTES } from './limits.mjs';

/**
 * The Worker in front of yourcardbuyer.com.
 *
 * Every request passes through here first (run_worker_first in wrangler.toml).
 * Pages are sent to their one canonical address with a 301 when they arrive on
 * www, plain http or a non-canonical path spelling, then handed to the built
 * files. The only request that does real work is the seller form posted to
 * /api/sell.
 *
 * Environment (wrangler.toml vars and secrets):
 *   SITE_DOMAIN         yourcardbuyer.com (var)
 *   GHL_LOCATION_ID     Your Card Buyer sub-account (var)
 *   GHL_PHOTO_FIELD_ID  file-upload custom field for photos (var, optional)
 *   GHL_PIPELINE_ID     pipeline for new submissions (var, optional)
 *   GHL_STAGE_ID        first stage of that pipeline (var, optional)
 *   GHL_TOKEN           private integration token (secret)
 */

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'x-robots-tag': 'noindex' },
  });

/** One spelling per page: a directory with a trailing slash. Files keep their names. */
const normalPath = (pathname) => {
  if (pathname.startsWith('/api/')) return pathname;
  let path = pathname.replace(/\/{2,}/g, '/');
  path = path.replace(/\/index\.html$/, '/');
  path = path.replace(/^(.*\/[^/.]+)\.html$/, '$1/');
  const last = path.slice(path.lastIndexOf('/') + 1);
  return path.endsWith('/') || last.includes('.') ? path : `${path}/`;
};

/** Only GET and HEAD move: a 301 turns a POST into a GET and would drop the form. */
export const canonicalLocation = (request, env) => {
  const domain = env.SITE_DOMAIN;
  if (!domain) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const url = new URL(request.url);
  const path = normalPath(url.pathname);
  if (url.protocol === 'https:' && url.host === domain && path === url.pathname) return null;
  return `https://${domain}${path}${url.search}`;
};

const isImage = (file) =>
  /^image\//.test(file.type || '') || /\.(jpe?g|png|gif|heic|heif|webp)$/i.test(file.name || '');

/** Splits uploaded photos into those to send and a list of why any were left off. */
export function choosePhotos(files) {
  const keep = [];
  const dropped = [];
  let total = 0;
  for (const file of files) {
    if (!file || typeof file === 'string' || file.size === 0) continue;
    if (!isImage(file)) { dropped.push(`${file.name || 'file'}: not a photo`); continue; }
    if (keep.length >= MAX_PHOTOS) { dropped.push(`${file.name || 'photo'}: over ${MAX_PHOTOS} photos`); continue; }
    if (file.size > MAX_PHOTO_BYTES) { dropped.push(`${file.name || 'photo'}: over 10 MB`); continue; }
    if (total + file.size > MAX_TOTAL_BYTES) { dropped.push(`${file.name || 'photo'}: total size limit`); continue; }
    total += file.size;
    keep.push(file);
  }
  return { keep, dropped };
}

export async function receiveSubmission(request, env, { fetchImpl = fetch } = {}) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'POST', 'x-robots-tag': 'noindex' } });
  }
  if (!env.GHL_TOKEN || !env.GHL_LOCATION_ID) {
    console.error('sell: GHL_TOKEN or GHL_LOCATION_ID is not set on this Worker');
    return json(503, { error: 'Submissions are not configured' });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'Could not read the request' });
  }

  const fields = {};
  for (const key of new Set([...form.keys()])) {
    if (key === 'photos') continue;
    const values = form.getAll(key).filter((v) => typeof v === 'string');
    fields[key] = values.join(', ');
  }

  const hasContact = ['phone', 'email'].some((k) => (fields[k] || '').trim().length > 0);
  if (!hasContact) return json(400, { error: 'Nothing to record' });

  const hosts = [env.SITE_DOMAIN].filter(Boolean).map((h) => h.toLowerCase());
  const verdict = spamScore(fields, request, hosts);
  const { keep, dropped } = choosePhotos(form.getAll('photos'));

  let result;
  try {
    result = await writeSubmission({
      fields,
      photos: keep,
      dropped,
      token: env.GHL_TOKEN,
      locationId: env.GHL_LOCATION_ID,
      photoFieldId: env.GHL_PHOTO_FIELD_ID,
      pipelineId: env.GHL_PIPELINE_ID,
      stageId: env.GHL_STAGE_ID,
      sourceSite: env.SITE_DOMAIN,
      verdict,
      fetchImpl,
    });
  } catch (error) {
    console.error('sell: could not reach GHL', error);
    return json(502, { error: 'Could not save the submission' });
  }

  if (!result.ok) {
    console.error(`sell: GHL ${result.step} failed (${result.status})`, result.detail);
    return json(502, { error: 'Could not save the submission' });
  }

  /* Same answer whether or not it scored as spam, so a bot learns nothing. */
  const photos = verdict.discard ? 'ok' : result.photos;
  if (fields.client !== 'script') {
    const location = photos === 'missing' ? '/thank-you/?photos=missing' : '/thank-you/';
    return new Response(null, { status: 303, headers: { location } });
  }
  return json(200, { ok: true, photos });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const location = canonicalLocation(request, env);
    if (location) return new Response(null, { status: 301, headers: { location } });
    if (url.pathname === '/api/sell') return receiveSubmission(request, env);
    if (url.pathname.startsWith('/api/')) return json(404, { error: 'Not found' });
    return env.ASSETS.fetch(request);
  },
};

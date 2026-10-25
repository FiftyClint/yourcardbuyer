/**
 * What a junk submission looks like. Ported from the party boat receiver,
 * which ported it from PoweredLandCo. The lesson that carried over: a missing
 * load stamp is evidence, not innocence. Every real submission from our page
 * carries form_loaded_at.
 *
 * Weighted so no single soft signal buries a real seller. FLAG_AT marks a
 * submission for a second look and still notifies. DISCARD_AT keeps it out of
 * notifications, but it is still written to GHL under its own tag so a
 * mistake can be found.
 */

const MIN_FILL_MS = 3000;
const FLAG_AT = 6;
const DISCARD_AT = 12;

const SPAM_LINK_HOST =
  /\b(?:telegra\.ph|t\.me|bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|shorturl|linkypay|freeurl|clickto)/i;

/** Any character from a non-Latin script. Spanish and other Latin-script languages pass. */
const NON_LATIN = /[Ѐ-ӿͰ-Ͽ԰-֏Ⴀ-ჿ֐-׿؀-ۿऀ-ॿঀ-৿一-鿿぀-ヿ가-힯]/;

export const KINDS = new Set(['a-few-cards', 'collection', 'graded', 'sealed', 'mix']);
export const COUNTS = new Set(['', 'unsure', 'under-50', '50-500', '500-5000', 'over-5000']);

export function spamScore(fields, request, hosts = []) {
  const reasons = [];
  const add = (weight, reason) => reasons.push({ weight, reason });
  const text = (key) => (typeof fields[key] === 'string' ? fields[key].trim() : '');

  const isOurHost = (value) => {
    try {
      const { hostname } = new URL(value);
      return hosts.includes(hostname.replace(/^www\./, ''));
    } catch {
      return false;
    }
  };

  if (text('website').length > 0) add(10, 'honeypot filled');

  const loadedAt = Number(fields.form_loaded_at);
  if (Number.isFinite(loadedAt) && loadedAt > 0) {
    const elapsed = Date.now() - loadedAt;
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) add(10, 'submitted faster than a person can type');
  } else {
    add(3, 'no page load stamp');
  }

  const origin = request?.headers?.get('origin');
  const referer = request?.headers?.get('referer');
  if (hosts.length > 0 && !isOurHost(origin) && !isOurHost(referer)) add(5, 'not posted from one of our pages');

  const description = text('description');
  if (/https?:\/\//i.test(description)) add(5, 'link in the description');
  if (SPAM_LINK_HOST.test(description)) add(5, 'link goes somewhere only spam goes');
  if (NON_LATIN.test(description)) add(6, 'description is not in a Latin alphabet');
  if (hosts.some((h) => description.toLowerCase().includes(h))) add(5, 'quotes our own address back at us');

  if (description.length === 0) add(3, 'no description');
  if (!KINDS.has(text('kind'))) add(5, 'kind is not one of the options');
  if (!COUNTS.has(text('count'))) add(5, 'count is not one of the options');
  if (/^[a-z]{8,}$/.test(text('name'))) add(3, 'name looks generated');

  const digits = text('phone').replace(/\D/g, '');
  if (digits.length === 11 && !digits.startsWith('1')) add(5, 'phone is not a usable number');
  if (digits.length > 0 && digits.length < 10) add(3, 'phone is too short to call');

  const total = reasons.reduce((sum, r) => sum + r.weight, 0);
  return { spam: total >= FLAG_AT, discard: total >= DISCARD_AT, total, reasons: reasons.map((r) => r.reason) };
}

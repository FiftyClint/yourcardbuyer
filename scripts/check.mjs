#!/usr/bin/env node
/**
 * Copy rules, enforced rather than trusted. Run after `npm run build`.
 *
 *   npm run check          em dashes, exclamation points and banned claims
 *   npm run check:launch   all of the above, plus: no [bracket] left on the
 *                          real site, and the Worker has somewhere to put photos
 *
 * Banned claims are things nobody can verify or that promise a price:
 * "top dollar", "highest prices", "guaranteed", ratings and reviews. The site
 * may only say what Clint has told us is true.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const launch = process.argv.includes('--launch');
const problems = [];

const BANNED = [
  'top dollar', 'highest price', 'highest prices', 'best price', 'best prices', 'pay the most', 'pay more than',
  'guarantee', 'guaranteed', 'guarantees', 'top rated', 'five star', '5 star', 'number one', '#1', 'trusted by',
  'thousands of', 'reviews', 'testimonial', 'same day', 'instant offer', 'instant cash', 'licensed', 'insured',
];
const BANNED_RE = new RegExp(`(${BANNED.map((t) => t.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&')).join('|')})`, 'gi');

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

/** Visible text only: drop scripts, styles and tags. */
const visible = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ');

const near = (text, i) => text.slice(Math.max(0, i - 50), i + 50).trim();

const files = [
  ...(existsSync(`${ROOT}dist`) ? walk(`${ROOT}dist`).filter((f) => f.endsWith('.html')) : []),
  ...(existsSync(`${ROOT}preview`) ? walk(`${ROOT}preview`).filter((f) => f.endsWith('.html')) : []),
];
if (files.length === 0) {
  console.error('Nothing built. Run `npm run build` first.');
  process.exit(1);
}

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const text = visible(html);
  const rel = relative(ROOT, file);
  for (const m of text.matchAll(/[—―]/g)) problems.push(`${rel}: em dash near "${near(text, m.index)}"`);
  for (const m of text.matchAll(/!/g)) problems.push(`${rel}: exclamation point near "${near(text, m.index)}"`);
  for (const m of text.matchAll(BANNED_RE)) problems.push(`${rel}: unverifiable claim "${m[0]}" near "${near(text, m.index)}"`);

  if (launch && rel.startsWith('dist')) {
    const todos = [...html.matchAll(/<mark class="todo">\[([^\]]*)\]<\/mark>/g)].map((m) => m[1]);
    for (const t of new Set(todos)) problems.push(`${rel}: unfilled fact [${t}] (set it in site.config.mjs)`);
  }
}

if (launch) {
  const toml = readFileSync(`${ROOT}wrangler.toml`, 'utf8');
  if (/GHL_PHOTO_FIELD_ID\s*=\s*""/.test(toml)) problems.push('wrangler.toml: GHL_PHOTO_FIELD_ID is empty, so photos would not be stored');
}

if (problems.length) {
  console.error(`${problems.length} problem(s):\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exit(1);
}
console.log(`ok: ${files.length} page(s) checked${launch ? ' for launch' : ''}`);

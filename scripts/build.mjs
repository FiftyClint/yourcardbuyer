#!/usr/bin/env node
/**
 * Builds the site into dist/ and the review copy into preview/index.html.
 *
 *   node scripts/build.mjs           both
 *   node scripts/build.mjs --site    dist/ only
 *   node scripts/build.mjs --preview preview/ only
 */
import { mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, existsSync } from 'node:fs';
import { SITE } from '../site.config.mjs';
import { page } from '../src/layout.mjs';
import { homeBody, MAX_PHOTOS } from '../src/pages/home.mjs';
import { privacyBody, termsBody, thanksBody, notFoundBody } from '../src/pages/legal.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const doSite = !args.includes('--preview');
const doPreview = !args.includes('--site');

const client = (preview) =>
  readFileSync(`${ROOT}src/client.js`, 'utf8')
    .replace('__MAX_PHOTOS__', String(MAX_PHOTOS))
    .replace('__PREVIEW__', preview ? 'true' : 'false');

const DESCRIPTION =
  'Sell your sports cards to a buyer. Send photos of a few cards or a whole collection and get a straight offer, with no obligation to sell.';

const write = (path, html) => {
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  writeFileSync(path, html);
};

if (doSite) {
  const out = `${ROOT}dist`;
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  if (existsSync(`${ROOT}public`)) cpSync(`${ROOT}public`, out, { recursive: true });
  cpSync(`${ROOT}src/styles.css`, `${out}/styles.css`);

  write(`${out}/index.html`, page({
    mode: 'site', title: `${SITE.name} | Sell your sports cards`, description: DESCRIPTION, path: '/',
    body: homeBody('site'), script: client(false),
  }));
  write(`${out}/privacy/index.html`, page({
    mode: 'site', title: `Privacy Policy | ${SITE.name}`, description: `How ${SITE.name} handles what you send.`,
    path: '/privacy/', noindex: true, body: privacyBody(),
  }));
  write(`${out}/terms/index.html`, page({
    mode: 'site', title: `Terms of Use | ${SITE.name}`, description: `The terms for using ${SITE.name}.`,
    path: '/terms/', noindex: true, body: termsBody(),
  }));
  write(`${out}/thank-you/index.html`, page({
    mode: 'site', title: `Sent | ${SITE.name}`, description: 'Your submission was received.',
    path: '/thank-you/', noindex: true, body: thanksBody(),
    script: "if (/[?&]photos=missing/.test(location.search)) document.getElementById('photo-note').hidden = false;",
  }));
  write(`${out}/404.html`, page({
    mode: 'site', title: `Page not found | ${SITE.name}`, description: 'That page is not here.',
    path: '/404', noindex: true, body: notFoundBody(),
  }));
  write(`${out}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://${SITE.domain}/sitemap.xml\n`);
  write(`${out}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://${SITE.domain}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>
</urlset>
`);
  console.log('built dist/');
}

if (doPreview) {
  const legal = `
<hr style="border:0;border-top:1px solid var(--line);margin:0">
<div class="wrap" style="padding-block:1rem"><p class="eyebrow">Separate pages on the live site</p></div>
${privacyBody('privacy')}
${termsBody('terms')}`;
  write(`${ROOT}preview/index.html`, page({
    mode: 'preview', title: SITE.name, description: DESCRIPTION, path: '/', fragment: true,
    body: homeBody('preview') + legal, script: client(true),
  }));
  console.log('built preview/index.html');
}

import { readFileSync } from 'node:fs';
import { SITE } from '../site.config.mjs';
import { esc, fact } from './util.mjs';

const CSS = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const FONTS =
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=IBM+Plex+Mono:wght@500;600&family=Public+Sans:wght@400;600;700&display=swap';

/**
 * Two builds from the same templates.
 *
 * site:    the real site. Full documents, absolute paths (/privacy/), shared
 *          stylesheet, the form posts to /api/sell on the Worker.
 * preview: a claude.ai Artifact Clint can open before launch. One fragment (the
 *          Artifact wraps it in its own document) holding the home page with
 *          the privacy and terms pages appended as sections, CSS inline, and a
 *          form that shows what it would send instead of sending it.
 */
export function link(mode, page) {
  // The preview is one file: the legal pages sit at the bottom of it as sections.
  if (mode === 'preview') return page === 'home' ? '#top' : `#${page}`;
  return page === 'home' ? '/' : `/${page}/`;
}

export function header(mode) {
  const home = mode === 'preview' ? '' : '/';
  return `
<header class="site-header">
  <div class="wrap">
    <a class="wordmark" href="${link(mode, 'home')}" aria-label="${esc(SITE.name)} home">
      <span class="wordmark-chip" aria-hidden="true"></span>
      <span class="wordmark-text">${esc(SITE.name)}</span>
    </a>
    <nav class="nav" aria-label="Main">
      <a href="${home}#how">How it works</a>
      <a href="${home}#buy">What we buy</a>
      <a href="${home}#faq">Questions</a>
      <a class="button button-small" href="${home}#sell">Get an offer</a>
    </nav>
  </div>
</header>`;
}

export function footer(mode) {
  const year = 2026;
  return `
<footer class="site-footer">
  <div class="wrap">
    <p>&copy; ${year} ${fact(SITE.legalName, 'operating entity legal name')}</p>
    <nav aria-label="Legal">
      <a href="${link(mode, 'privacy')}">Privacy</a>
      <a href="${link(mode, 'terms')}">Terms</a>
    </nav>
  </div>
</footer>`;
}

const banner = `
<div class="preview-banner" role="note">
  <div class="wrap">Preview. Yellow brackets are facts only you can fill in. The form does not send anything here.</div>
</div>`;

/**
 * @param {object} o
 * @param {'site'|'preview'} o.mode
 * @param {string} o.title       full <title>
 * @param {string} o.description meta description
 * @param {string} o.path        canonical path, e.g. '/' or '/privacy/'
 * @param {boolean} o.noindex
 * @param {boolean} o.fragment   preview home page only: no document wrapper
 * @param {string} o.body
 * @param {string} [o.script]
 */
export function page({ mode, title, description, path, noindex = false, fragment = false, body, script = '' }) {
  const canonical = `https://${SITE.domain}${path}`;
  const head = `<title>${esc(title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${esc(description)}">
${mode === 'site' ? `<link rel="canonical" href="${canonical}">` : ''}
${noindex || mode === 'preview' ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${mode === 'site' ? `<meta property="og:url" content="${canonical}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
${mode === 'site' ? '<link rel="stylesheet" href="/styles.css">' : `<style>\n${CSS}\n</style>`}`;

  const content = `${mode === 'preview' ? banner : ''}${header(mode)}
<main id="top">
${body}
</main>
${footer(mode)}
${script ? `<script>\n${script}\n</script>` : ''}`;

  if (fragment) return `${head}\n${content}\n`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body>
${content}
</body>
</html>
`;
}

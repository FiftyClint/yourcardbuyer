# Your Card Buyer

yourcardbuyer.com: a sell-your-sports-cards site. Sellers send photos and a description,
the submission lands in the GHL "Your Card Buyer" sub-account, and Clint makes an offer.

Start with **STATUS.md** (where things stand) and **CLAUDE.md** (the rules).

## How it works

- `site.config.mjs` holds every fact only Clint can state. Unknowns are `null` and render
  as yellow brackets.
- `node scripts/build.mjs` writes the real site to `dist/` and a one-file review copy to
  `preview/index.html` (published as a private claude.ai Artifact for Clint).
- `worker/` is the Cloudflare Worker: it serves `dist/`, 301s www/http/slashless paths to
  one address, and receives the form at `/api/sell` (contact, photos, note, tags into GHL).

## Commands

```bash
npm install
npm run verify        # build, copy checks, receiver tests
npm run check:launch  # fails while any bracket or the photo field is missing
npm run dev           # local Worker at localhost:8787
```

Ported from FiftyClint/partyboat (receiver, spam scoring, canonical redirects, copy guards),
cut down to one site with no framework.

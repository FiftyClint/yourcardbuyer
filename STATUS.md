# Status

Last updated 2026-10-25.

## Done

- Site built: one sell page (how it works, what we buy, photo tips, offer form with up to
  12 photos, questions, contact) plus privacy, terms, thank-you and 404.
- Form receiver: contact upsert, photos into a GHL file field, note, tags, optional
  opportunity. 14 tests pass against a stubbed GHL. Worker bundles (wrangler dry run).
- Copy checks pass. Launch check blocks on every unfilled fact.
- Preview published as a private claude.ai Artifact for Clint.

## Facts checked 2026-10-25

- yourcardbuyer.com: GoDaddy registrar, registered 2026-10-18, expires 2027-10-18,
  GoDaddy nameservers, no MX record (no email on the domain). Verisign RDAP and Google DNS.
- GHL "Your Card Buyer" sub-account exists (created 2026-10-18), only the template
  "Marketing Pipeline", no custom fields, SaaS mode off.

## Blocked on Clint

| What | Why |
| --- | --- |
| Facts in `site.config.mjs`: entity, state, phone, email, area, in person or mail, payment, reply time, minimum, what you buy, name on site | Launch check fails until each is set |
| GHL: private integration token, photo field, pipeline, alert workflow (docs/GHL-SETUP.md) | The form cannot save anything without the token |
| Three GitHub secrets (docs/LAUNCH.md) | Deploy |
| Go-live yes, then nameservers to Cloudflare | Nothing is live |

## Not verified

- GHL photo upload endpoint and API version header, until one real submission.
- Exact GHL screen names in docs/GHL-SETUP.md.

## Costs so far

$0 beyond the domain.

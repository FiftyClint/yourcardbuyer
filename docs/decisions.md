# Decisions

## 2026-10-25 (Claude, within the brief)

- **No framework.** One page plus legal pages does not need Astro. Plain templates in
  `src/`, a 100-line build script, the party boat Worker pattern.
- **Photos go into GHL, not separate storage.** A file-upload custom field keeps the photos
  on the contact Clint is already looking at, and avoids a storage bucket and its billing.
- **Photos shrink in the browser** to 2000px JPEG before upload. Phone photos are large and
  sellers are often on a weak signal.
- **A failed photo upload never loses the seller.** The contact and note are saved, the
  thank-you page asks them to send photos when contacted, and the contact is tagged.
- **Email required, phone optional.** Matches how offers go out; texting needs its own box.
- **Offer wording.** The FAQ says offers are based on recent sales of the same cards in
  similar condition, which matches how Card Alpha values cards. Clint to confirm.
- **No route in wrangler.toml** until Clint says go, so a deploy cannot reach the live domain.

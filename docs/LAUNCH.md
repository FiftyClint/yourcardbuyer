# Launch (only after Clint says go)

1. Fill every `null` in `site.config.mjs`. `npm run check:launch` must pass.
2. GHL steps 1 to 4 (docs/GHL-SETUP.md).
3. GitHub secrets: repo **Settings** > **Secrets and variables** > **Actions** > **New repository secret**:
   `GHL_TOKEN`, `CLOUDFLARE_API_TOKEN` (Workers edit permission), `CLOUDFLARE_ACCOUNT_ID`.
4. Run the **Deploy** workflow (Actions tab). It lands on the workers.dev address first.
5. Send one real test submission with two photos. Confirm the contact, photos, note and tags in GHL.
6. Add yourcardbuyer.com to Cloudflare, switch the nameservers in GoDaddy to the two Cloudflare
   gives you, uncomment the routes block in `wrangler.toml`, deploy again.
7. Google Search Console and Bing Webmaster Tools: add the site and submit `/sitemap.xml`.

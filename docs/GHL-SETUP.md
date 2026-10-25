# GHL setup (Clint, in the GHL screen)

All in the **Your Card Buyer** sub-account. Switch to it first: click the account name at the
top left of GHL and pick Your Card Buyer. Screen names below may differ slightly; GHL renames things.

## 1. Private integration token (the site's key to GHL)

1. Click **Settings** (bottom left).
2. Click **Private Integrations**.
3. Click **Create new Integration**. Name it `yourcardbuyer site`.
4. Tick these permissions: View Contacts, Edit Contacts, Edit Forms (file uploads),
   Edit Opportunities, View Custom Fields.
5. Click **Create**. Copy the token it shows. It is shown once.
6. Put it in GitHub as a secret named `GHL_TOKEN` (docs/LAUNCH.md). Do not paste it in chat.

## 2. Photo field

1. **Settings** > **Custom Fields** > **Add Field**.
2. Pick **File Upload**. Name it `Card photos`.
3. Allow multiple files, maximum 12. Accepted formats: All.
4. Save. Claude reads the field ID from GHL and puts it in `wrangler.toml`.

## 3. Pipeline (optional, recommended)

1. **Opportunities** > **Pipelines** > **Create new pipeline**. Name it `Card Offers`.
2. Stages, in order: New, Reviewing, Offer sent, Accepted, Bought, Passed.
3. Save. Claude reads the IDs from GHL.

## 4. New submission alert

1. **Automation** > **Workflows** > **Create Workflow** > **Start from scratch**.
2. Trigger: **Contact Tag**, tag added, `ycb-new-submission`.
3. Action: **Internal Notification**, to you by SMS, email or both.
4. Save and **Publish**.

Text sellers only when the contact has the tag `ycb-sms-consent-yes`.

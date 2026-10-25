# Your Card Buyer: rules for any agent working here

Read STATUS.md first.

## What this is

A sports card buying site. Clint is the buyer. Sellers submit photos and a description;
Clint reviews and makes an offer. The site never quotes a price.

## Copy rules (enforced by `npm run check`)

1. No em dashes. No exclamation points.
2. No claim nobody can verify or that promises a price: "top dollar", "highest prices",
   "guaranteed", reviews, ratings, "licensed", "same day". See BANNED in `scripts/check.mjs`.
3. Never invent a fact about Clint: history, volume, prices paid, locations, reply time,
   payment methods. Unknown facts stay `null` in `site.config.mjs` and render as brackets.
4. Do not name an operating entity until Clint does. It is not assumed to be Aidren LLC.

## GHL

- Sub-account "Your Card Buyer", location `x2TNpESH8cl6WVaA2Gru`.
- Through Composio, connection `highlevel_mcp_shape-prest` (the default) is Your Card Buyer.
  `highlevel_mcp_marok-plew` is Party Boat. Name the connection on every call.
- That connection can read the account (location, pipelines, custom fields) but cannot
  create fields, pipelines, tokens or workflows. Those are Clint's clicks (docs/GHL-SETUP.md).
- `worker/ghl.mjs` is tested against a stub only. Treat the live API as unverified until
  one real submission lands with its photos.

## What needs Clint

DNS or nameserver changes, buying anything (phone numbers, plans), deploying to the live
domain, any message to a seller, naming the entity, and filling `site.config.mjs`.

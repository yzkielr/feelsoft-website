# Feelsoft website prototype

Static bilingual wholesale catalogue. Run `npm start` and open `http://127.0.0.1:4177`. Run `npm test` for business and DOM integration checks. Runtime has no external JavaScript dependencies; images and fonts are served locally.

## Edit content

- `dist/index.html`: Indonesian content and page structure.
- `dist/content.js`: English content and runtime messages.
- `dist/core.js`: WhatsApp, products, IDR prices, conversion rate and order logic. Never substitute `0` for an unknown price; use `null`.
- `dist/styles.css`: responsive styling.
- `dist/references.html`: five researched reference websites and pending business data.
- `dist/assets/`: illustrative AI product imagery, temporary favicon, and Manrope font under OFL.

Confirmed: WhatsApp +62 821-7000-2960; Penjaringan, North Jakarta; children's socks IDR 26,000 per dozen; domestic and worldwide delivery. Split-toe pricing is unconfirmed. All quantities use dozens. The form prepares a WhatsApp draft and does not send or finalize orders automatically.

USD values are indicative conversions using Bank Indonesia JISDOR 18,278 IDR/USD dated 2026-11-20. Update `config` with an approved rate or replace with approved export prices before public launch. There is no live exchange-rate API. The customer-visible rate disclosure and reference page must be updated alongside the config.

The wordmark and images are temporary. Obtain the original logo, actual product photographs, SKU details and Algojaya/SKM price list from Tria. Do not reuse other manufacturers' claims, images, testimonials or certifications. `noindex` is intentional for the prototype; Sites access remains owner-private.

Visual browser QA was unavailable in the execution environment. Automated DOM tests are not a substitute for checking responsive layout in a real browser.

Image assets were generated using the built-in imagegen tool; full generation prompts are in `asset-prompts.json`. They are clearly marked as concept illustrations in the site.

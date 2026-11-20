# Feelsoft website prototype

Static bilingual wholesale catalogue. Run `npm start` and open `http://127.0.0.1:4177`. Run `npm test` for business and DOM integration checks. Runtime has no external JavaScript dependencies; images and fonts are served locally.

## Edit content

- `dist/index.html`: Indonesian content and page structure.
- `dist/content.js`: English content and runtime messages.
- `dist/core.js`: WhatsApp, products, IDR prices, conversion rate and order logic. Never substitute `0` for an unknown price; use `null`.
- `dist/catalog.js`: collection metadata, colour labels and indicative swatches.
- `dist/product.js` and `dist/catalog.css`: product detail interactions and responsive catalogue layouts.
- `scripts/sync-mk-catalog.mjs`: run `npm run sync:catalog` after catalogue changes; generates compact home cards, five detail pages, a separate price list and order options.
- `templates/pricelist-section.html`: source for the complete price table and estimator.
- `dist/styles.css`: responsive styling.
- `dist/references.html`: five researched reference websites and pending business data.
- `dist/assets/`: illustrative AI product imagery, supplied Feelsoft logo prepared with a transparent exterior, and Manrope font under OFL.

Confirmed: WhatsApp +62 821-7000-2960; Penjaringan, North Jakarta; children's socks IDR 26,000 per dozen; domestic and worldwide delivery. SKM split-toe prices per dozen: plain cream/black S 41,000, M 42,000, L 44,000 IDR; sole style (Telapak) S 42,000, M 43,000, L 44,000 IDR; patterned S 43,000, M 44,000, L 46,000 IDR. Lengths: S 26-28 cm, M 34-36 cm, L 40 cm. Variant and size selections are carried through the table, estimator, CSV and WhatsApp draft. All quantities use dozens. The form prepares a WhatsApp draft and does not send or finalize orders automatically.

USD values are indicative conversions using Bank Indonesia JISDOR 18,278 IDR/USD dated 2026-11-20. Update `config` with an approved rate or replace with approved export prices before public launch. There is no live exchange-rate API. The customer-visible rate disclosure and reference page must be updated alongside the config.

The supplied Feelsoft logo is installed. The exterior white background was removed with the built-in imagegen tool while preserving the brand artwork. Product images remain illustrative. Both supplied price lists, SKM and Algojaya, are implemented. Obtain actual product photographs, material and size details, availability, and order terms from Tria. Do not reuse other manufacturers' claims, images, testimonials or certifications. `noindex` is intentional for the prototype; Sites access remains owner-private.

Algojaya prices per dozen: all six MK Casual options (Mix Cokelat, Mix, Hitam, Navy, Abu Tua, Abu Muda) are IDR 25,500. MK Mesh Navy, Hitam and Abu Muda are IDR 26,000; Putih is IDR 26,500. MK Mini Putih is IDR 26,500; Hitam, Navy and Abu Muda are IDR 26,000. MK sizes were not supplied and are not inferred from the split-toe range. English WhatsApp drafts include the original Indonesian catalogue name to keep orders identifiable. The downloadable price list contains 24 priced entries: 14 MK, 9 SKM size/variant combinations, and 1 kids' entry.

The landing page shows one card per collection. Casual, Mesh and Mini detail pages offer their own colour choices; Jempol offers three variants and sizes S/M/L with supplied lengths. The full 24-entry price list, estimator and CSV export are on `pricelist.html`. Selection, quantity, language and WhatsApp order details stay synchronized; colour samples and product images remain illustrative.

Visual browser QA was unavailable in the execution environment. Automated DOM tests are not a substitute for checking responsive layout in a real browser.

Product image assets were generated and the supplied logo was prepared using the built-in imagegen tool; full generation prompts are in `asset-prompts.json`. They are clearly marked as concept illustrations in the site.

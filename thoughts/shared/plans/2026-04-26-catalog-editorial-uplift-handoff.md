# Catalog Editorial Uplift Handoff

## Goal

Bring the generated catalog closer to the client's original editorial template while keeping the current CSV-driven generator workflow intact.

## Current Output

- Latest generated PDF: [catalog-generator/output/catalogo.pdf](/Users/nacho/saski/mybroworld/catalog-generator/output/catalogo.pdf)
- Latest generated HTML preview: [catalog-generator/output/catalogo-preview.html](/Users/nacho/saski/mybroworld/catalog-generator/output/catalogo-preview.html)
- Render command:

```bash
cd /Users/nacho/saski/mybroworld/catalog-generator
npm run generate -- --input data/CATALOGO_BASE.csv --output output/catalogo.pdf --catalog-title "Catálogo 2026" --artist-name "Lucía Astuy"
```

Note: Puppeteer PDF rendering required running outside the sandbox in this session.

## Reference Artifacts Used

The original Drive links were not directly readable without authentication in this session, so the visual work used local reference artifacts already present on disk:

- `/Users/nacho/Downloads/catálogo.ai`
  - Most useful reference for current layout decisions.
  - Shows the expected white background, logo placement, and bottom-left metadata block.
- `/Users/nacho/Downloads/catálogo 03 2026.pdf`
  - Used as a secondary reference and as the source for a studio cover photo.

## Implemented Decisions

- The catalog now uses a luminous white editorial background instead of black pages.
- The cover now follows the original PDF more closely, with:
  - white wordmark at the bottom-right
  - section-led caption at the bottom-left, for example `Obra disponible | Marzo 2026`
- The latest catalog period is derived from the latest included `date_label` value, for example `03/26 -> Marzo 2026`.
- Artwork pages now use:
  - small editorial kicker at the top-left, for example `Catálogo | Obra disponible`
  - muted wordmark at the top-right
  - large centered artwork
  - centered metadata block under the artwork
- The closing page is now minimal and white, with the wordmark centered above the contact details.
- The CSS fallback typography now uses Avenir Next only, which removes the earlier Futura/Avenir mixture and gets closer to Gotham's overall color and spacing.

## Client Feedback Accepted On 2026-05-01

- Catalog image selection: the customer will manually mark one catalog image per artwork by making its filename end in `_cat`. Do not build automatic generation or copy creation for `_cat` images.
- Catalog inclusion: use `include_in_catalog` (column L in the live sheet) as the editorial inclusion gate. Do not infer inclusion from availability/status alone.
- Catalog ordering: newest works first.
- Artwork page fields: show only artwork title, production year, dimensions, technique, and PVP price.
- Artwork page layout: place the metadata block immediately after the image, separated by whitespace comparable to the side margin around the image.
- Unavailable/sold/reserved treatment: defer to `include_in_catalog`; included works should show PVP price and should not add availability/status copy unless the customer later requests it.
- Cover: current cover image is approved.
- Closing-page contact details:
  - `hola@luciastuy.com`
  - `635.166.253`
  - `IG: @luciastuy`
  - `www.luciastuy.com`
- Fonts and brand assets: the customer says Gotham fonts and PNG logos are in `https://drive.google.com/drive/folders/1J98-QwFiEkRu99BLjvEbfE_J3C5FxRy9`.
- Asset access note: this session's Google Drive connector could not list either the image-selection folder or the assets folder, so asset download and verification remain pending.

## Source Files Carrying The Work

- Layout and page structure: [catalog-generator/src/template.js](/Users/nacho/saski/mybroworld/catalog-generator/src/template.js)
- Editorial styling: [catalog-generator/src/styles.css](/Users/nacho/saski/mybroworld/catalog-generator/src/styles.css)
- Catalog period derivation from `date_label`: [catalog-generator/src/catalog-generator.mjs](/Users/nacho/saski/mybroworld/catalog-generator/src/catalog-generator.mjs)
- Regression coverage for the visual shell: [catalog-generator/test/catalog-generator-cli.test.mjs](/Users/nacho/saski/mybroworld/catalog-generator/test/catalog-generator-cli.test.mjs)
- Operator-facing notes: [catalog-generator/README.md](/Users/nacho/saski/mybroworld/catalog-generator/README.md)

## Reference Assets Added To The Repo

- Cover photo extracted from a local reference PDF:
  - [catalog-generator/assets/reference-cover.jpg](/Users/nacho/saski/mybroworld/catalog-generator/assets/reference-cover.jpg)
- White wordmark extracted from a local reference PDF:
  - [catalog-generator/assets/reference-wordmark.png](/Users/nacho/saski/mybroworld/catalog-generator/assets/reference-wordmark.png)
- Black wordmark extracted from the local `.ai` reference:
  - [catalog-generator/assets/reference-wordmark-dark.png](/Users/nacho/saski/mybroworld/catalog-generator/assets/reference-wordmark-dark.png)

These are temporary production aids, not yet confirmed as final client-approved brand assets.

## Verification Completed

- `npm test`
- `npm run generate -- --input data/CATALOGO_BASE.csv --output output/catalogo.pdf --catalog-title "Catálogo 2026" --artist-name "Lucía Astuy"`
- Visual spot checks against extracted reference pages:
  - cover
  - first artwork page
  - additional interior artwork page
  - closing page

## Known Gaps And Blockers

### 1. Gotham Fonts And Logo Assets Need Verification

The original `.ai` explicitly references:

- `Gotham-Light.otf`
- `Gotham-LightIta.otf`
- `Gotham-Medium.otf`
- `Gotham-BoldIta.otf`
- `Gotham-Black.otf`

No installable Gotham font files were found locally in the earlier session:

- `/Users/nacho`
- `/Users/luciaastuy`
- `/Library/Fonts`
- `/System/Library/Fonts`
- typical Adobe cache and support directories searched during the session

Current CSS therefore uses `Avenir Next` fallback weights instead of Gotham. The customer reports that Gotham fonts and logo PNGs are now in the shared Drive folder `https://drive.google.com/drive/folders/1J98-QwFiEkRu99BLjvEbfE_J3C5FxRy9`, but this session could not list that folder through the available Drive connector. Download and verification are still required before replacing the fallback assets.

### 2. `_cat` Image Selection Needs Implementation

The client decision is now clear:

- Drive folder under review: `https://drive.google.com/drive/folders/1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh`
- The customer will make the chosen catalog image filename end in `_cat`.
- The system should use that existing `_cat` image for the catalog.
- The system should not generate, copy, or infer `_cat` images automatically.

Implementation still needs to decide how to map `_cat` files back to artwork rows. Missing or duplicate `_cat` images should be reported as blockers instead of guessed.

### 3. Catalog Layout And Data Rules Need Implementation

The generator still needs to be updated to match the latest accepted rules:

- sort newest first
- filter by `include_in_catalog` as editorial selection, with `catalog_ready` only as a technical QA gate
- show only title, year, dimensions, technique, and PVP price
- remove status labels, public notes, location/history, and non-PVP price variants from artwork pages
- move the metadata block directly under the image with the approved spacing

### 4. Drive References Were Not Reliably Readable Anonymously

The Google Drive folders provided by the user were not readable through this session's available Drive connector. Future sessions should use an authenticated Drive context, have the client share the folders with the connected account, or copy approved exported files into the workspace.

## Client Input Still Needed

To continue without rework, the next session should collect or confirm:

1. Access to the Drive folder that contains Gotham fonts and logo PNGs.
2. Access to the Drive image folder after the customer has added `_cat` suffixes.
3. Confirmation of the exact mapping rule between `_cat` filenames and `artwork_id` or title if filenames are not already deterministic.
4. Whether multiple output variants are needed (commercial PDF, dossier PDF, print PDF, etc.).

## Recommended Next Session Start

1. Read `AGENTS.md`.
2. Read `.agents/docs/chat-memory-protocol.md`.
3. Read this handoff.
4. Inspect:
   - [catalog-generator/src/template.js](/Users/nacho/saski/mybroworld/catalog-generator/src/template.js)
   - [catalog-generator/src/styles.css](/Users/nacho/saski/mybroworld/catalog-generator/src/styles.css)
   - [catalog-generator/output/catalogo.pdf](/Users/nacho/saski/mybroworld/catalog-generator/output/catalogo.pdf)
5. Decide whether the next step is:
   - asset acquisition
   - photo selection policy
   - typography correction with real Gotham
   - another visual iteration after client feedback

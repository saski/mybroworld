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

### 1. Gotham Fonts Are Still Missing

The original `.ai` explicitly references:

- `Gotham-Light.otf`
- `Gotham-LightIta.otf`
- `Gotham-Medium.otf`
- `Gotham-BoldIta.otf`
- `Gotham-Black.otf`

However, no installable Gotham font files were found in:

- `/Users/nacho`
- `/Users/luciaastuy`
- `/Library/Fonts`
- `/System/Library/Fonts`
- typical Adobe cache and support directories searched during the session

Current CSS therefore uses `Avenir Next` fallback weights instead of Gotham. This is closer than the earlier mixed `Futura`/`Avenir` treatment, but it is still not exact Gotham parity.

### 2. Photo Selection Criteria Are Not Defined

This is the main unresolved product decision for continuing the catalog with quality:

- Drive folder under review: `https://drive.google.com/drive/folders/1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh`

The team still needs a reusable decision model for:

- artwork-only photo vs contextual/studio photo
- multiple available shots for the same work
- crop preference
- portrait vs landscape preference
- whether detail shots should ever replace the main artwork image

### 3. Final Brand Assets Are Not Confirmed

Still needed from the client:

- final approved logo/wordmark asset
- final approved cover image
- final typography package if Gotham must be exact

### 4. Drive References Were Not Reliably Readable Anonymously

The original Google Drive file link provided by the user redirected to authentication in this session. Future sessions should prefer:

- already-downloaded local reference files, or
- authenticated browser access, or
- client-provided exported reference files inside the workspace

## Client Input Still Needed

To continue without rework, the next session should collect or confirm:

1. Exact photo selection criteria for the Drive image folder.
2. Final list of works that must be included.
3. Final ordering rule for the catalog.
4. Treatment rules for sold, reserved, historical, and unavailable works.
5. Gotham font files or an approved fallback.
6. Final logo/wordmark files.
7. Final approved cover image.
8. Final contact details and any additional contact channels.
9. Whether multiple output variants are needed (commercial PDF, dossier PDF, print PDF, etc.).

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

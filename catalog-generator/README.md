# Lucia Astuy Catalog Generator

Generate a catalog PDF from a normalized CSV exported from Google Sheets.

## Workflow

1. Export the normalized sheet to CSV.
2. Save it as `data/catalog.csv`.
3. Run:

```bash
npm install
npm run generate -- --input data/catalog.csv --output output/catalogo.pdf --catalog-title "Catalog 2026" --artist-name "Lucía Astuy"
```

You can also render directly from a public Google Sheets CSV export URL:

```bash
GOOGLE_SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..." npm run generate -- --output output/catalogo.pdf --catalog-title "Catalog 2026"
```

## Output Controls

- `--catalog-title` sets the cover title and the default output filename stem.
- `--artist-name` overrides the artist name shown on the cover and closing page.
- `--output` sets the PDF destination path.
- `--limit` renders only the first N eligible artworks.
- When the CSV includes `date_label` values such as `03/26`, the cover caption uses the latest included month as an editorial period label, for example `Marzo 2026`.

## Expected CSV Fields

Minimum columns:

- `title_clean`
- `year`
- `medium_clean`
- `support_clean`
- `dimensions_clean`
- `status_normalized`
- `price_display_clean`
- `image_main`
- `include_in_catalog`
- `catalog_ready`
- `catalog_section`
- `catalog_order`
- `show_price`
- `catalog_notes_public`

## Included Rules

- An artwork is included only when:
  - `include_in_catalog = TRUE`
  - `catalog_ready = TRUE`
- The price is shown only when:
  - `status_normalized = available`
  - `show_price = TRUE`
- If the price is hidden, the PDF shows an editorial availability label instead:
  - `Reservada`
  - `Obra no disponible`
  - `Obra histórica`

## Google Sheets Action

This generator now ships with a first installable Google Sheets action:

- Bound Apps Script source: [catalog-generator/apps-script](/Users/nacho/saski/mybroworld/catalog-generator/apps-script)
- Local queue agent source: [catalog-generator/catalog-agent](/Users/nacho/saski/mybroworld/catalog-generator/catalog-agent)
- Admin rollout guide: [thoughts/shared/docs/google-sheets-catalog-action.md](../thoughts/shared/docs/google-sheets-catalog-action.md)

The Google Sheets flow supports:

- current compatible tab
- selected compatible tabs
- all compatible yearly tabs
- explicit execution-profile routing
- Drive upload of the generated PDF

## Commands

```bash
npm run generate
npm run catalog-agent:authorize -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
npm run catalog-agent:once -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
```

## Common Errors

- `failed code=input_missing message=Provide --input <path> or --input-url <url>.`
  The command was run without a local CSV path or a Google Sheets CSV export URL.

- `The active tab is not compatible with the catalog contract.`
  The selected yearly tab is missing one or more required canonical headers such as `artwork_id`, `title_clean`, or `image_main`.

- `An output folder is required before queueing a job.`
  The selected execution profile has no default Drive folder and the sidebar form did not provide one.

- `Authenticated Google identity <email> does not match configured <email>.`
  The local `catalog-agent` is using the wrong Google account for the selected execution profile.

## Notes

- The PDF is rendered with HTML/CSS and Puppeteer.
- The stylesheet is tuned for portrait A4.
- The current template follows the original editorial PDF more closely: section-led photographic cover, white artwork pages with a top kicker and centered metadata block, and a centered closing brand stack.
- Reference art-direction assets live in [catalog-generator/assets](/Users/nacho/saski/mybroworld/catalog-generator/assets).
- You can refine the visual design in `src/styles.css` and `src/template.js`.

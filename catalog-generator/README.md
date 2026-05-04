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
- `--catalog-image-manifest` points to a Drive file manifest JSON. When provided, every included artwork must have exactly one matching filename ending in `_cat`.
- The cover caption shows only the configured catalog title. `date_label` is used for artwork ordering, not for a cover month/year label.

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

The optional catalog image manifest accepts either an array or an object with a
`files` array. Each file needs `id` and `name` fields from Google Drive, for
example:

```json
{
  "files": [
    { "id": "drive-file-id", "name": "LA-2026-001_cat.jpg", "mimeType": "image/jpeg" }
  ]
}
```

## Included Rules

- An artwork is included only when:
  - `include_in_catalog = TRUE`
  - `catalog_ready = TRUE`
- Included artworks are sorted newest first from `date_label`, then `year`, then `catalog_order`, then title.
- Artwork pages show only title, production year, dimensions, technique, and the PVP price.
- The PDF does not show availability labels, public notes, location/history, section labels, or non-PVP price variants.
- If a catalog image manifest is configured, filenames ending in `_cat` are matched by `artwork_id` first and title slug second. Missing or duplicate matches fail the render instead of falling back to another image.

## Google Sheets Action

This generator now ships with a first installable Google Sheets action:

- Bound Apps Script source: [catalog-generator/apps-script](apps-script)
- Local queue agent source: [catalog-generator/catalog-agent](catalog-agent)
- Cloud Run worker packaging: [catalog-generator/cloud-run](cloud-run)
- Admin rollout guide: [thoughts/shared/docs/google-sheets-catalog-action.md](../thoughts/shared/docs/google-sheets-catalog-action.md)

The Google Sheets flow supports:

- current compatible tab
- selected compatible tabs
- all compatible yearly tabs
- explicit execution-profile routing
- Drive upload of the generated PDF
- optional `_cat` image resolution through the agent config field `catalogImageFolderId`

## Commands

```bash
npm run generate
npm run catalog-agent:authorize -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
npm run catalog-agent:once -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
npm run catalog-agent:cloud-run-once
npm run catalog-agent:monitor -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
npm run catalog-agent:monitor:cloud-run
```

On macOS, the renderer can use the existing system Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` when Puppeteer's managed browser cache is empty.

For production portability, run the `lucia-mybrocorp` worker as an on-demand Cloud Run Job from the existing Google Cloud project `mybroworld-catalog-260501`. Apps Script starts the job immediately after queueing a production catalog. The Cloud Run entrypoint reads Secret Manager-provided JSON from `CATALOG_AGENT_CONFIG_JSON`, `CATALOG_AGENT_OAUTH_CLIENT_JSON`, and `CATALOG_AGENT_OAUTH_TOKEN_JSON`, copies those secrets into a writable runtime directory, then runs one catalog-agent polling pass.

In Linux containers where Chromium runs as UID 0, the renderer automatically adds `--no-sandbox` and `--disable-setuid-sandbox`. Without those flags, Chromium exits before generating the PDF.

The Cloud Run one-shot worker exits non-zero when it claims a job that ends in
`failed`, so Cloud Run execution logs can surface failed production work.
The separate catalog monitor checks `catalog_jobs` for recent failed rows, stale
queued rows, stale in-progress heartbeats, and completed rows missing a Drive
URL. Production deployment details live in [catalog-generator/cloud-run](cloud-run).

Set `catalogImageFolderId` in the agent config only after the image folder has one `_cat` file for every included, catalog-ready artwork. With that field set, the worker writes a per-job `catalog-images.json` manifest before rendering and the generator blocks ambiguous image selections.

## Common Errors

- `failed code=input_missing message=Provide --input <path> or --input-url <url>.`
  The command was run without a local CSV path or a Google Sheets CSV export URL.

- `The active tab is not compatible with the catalog contract.`
  The selected yearly tab is missing one or more required canonical headers such as `artwork_id`, `title_clean`, or `image_main`.

- `An output folder is required before queueing a job.`
  The selected execution profile has no default Drive folder and the sidebar form did not provide one.

- `Authenticated Google identity <email> does not match configured <email>.`
  The local `catalog-agent` is using the wrong Google account for the selected execution profile.

- `failed code=catalog_image_selection_blocked message=No _cat image found for artwork ...`
  The configured image folder does not contain exactly one customer-selected `_cat` image for an included artwork.

- `failed code=pdf_render_failed message=Unable to render PDF output: ...`
  Confirm that the local machine can launch Google Chrome in headless mode and that artwork image URLs are reachable. For agent jobs, inspect `catalog_jobs.log_excerpt` or Cloud Logging for the nested Puppeteer/Chromium cause.

## Notes

- The PDF is rendered with HTML/CSS and Puppeteer.
- The stylesheet is tuned for portrait A4.
- The template uses the approved cover image, official PNG logos, and embedded Gotham font files when those assets are present.
- Reference art-direction and brand assets live in [catalog-generator/assets](assets).
- You can refine the visual design in `src/styles.css` and `src/template.js`.

# Remote Shop Catalog Photo Gap Research

## Summary

The remote shop at `https://www.luciastuy.com/shop/` is not showing the artwork photos from the current catalog source. It is still exposing 15 legacy/demo WooCommerce products such as `Bottle`, `Audio`, `Armchair`, and `Transform`; the public WooCommerce Store API reports zero images for every one of those products.

The current catalog source is the Google Sheet `Lucia Astuy - CATALOGO_BASE` (`15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw`). Its live metadata showed `modifiedTime = 2026-05-01T15:19:14.258Z`, and the fetched workbook content showed 20 canonical `LA-2026-*` artwork rows with populated `image_main` Drive URLs. Recent `catalog_jobs` rows show completed PDF jobs with `result_artwork_count = 14`, including the production validation job `catalog_20260501_145137_9d09`.

The repository has a working Sheet -> PDF -> Drive path and a read-only WooCommerce/sheet parity audit, but it does not currently have an implemented production Sheet -> WooCommerce product/media import path. The existing docs already record the same inventory mismatch: 20 canonical sheet artworks missing from WooCommerce and 15 WooCommerce products unexpected relative to the sheet.

## Detailed Findings

### Remote WooCommerce Shop

What it does:

- The public shop pages respond with HTTP `200`.
- The rendered product grids use WooCommerce placeholder images rather than artwork photos.
- The public Store API exposes 15 products, all with `images.length = 0`.
- The WordPress product REST endpoint still returns nonzero `featured_media` IDs, but those attachment IDs do not resolve through the public media endpoint.

Evidence captured on 2026-05-01:

- `https://www.luciastuy.com/shop/` responded `HTTP/2 200`.
- `https://www.luciastuy.com/shop/page/2/` responded `HTTP/2 200`.
- Extracted shop image markup repeatedly used `https://www.luciastuy.com/wp-content/uploads/woocommerce-placeholder-300x300.png` with product alts such as `Armchair`, `Audio`, `Bottle`, `Sofa`, `Oak Tray`, and `Transform`.
- `https://www.luciastuy.com/wp-json/wc/store/v1/products?per_page=100` returned 15 products with zero images:
  - `Bottle`, `Audio`, `Vases`, `Clock`, `Coffee Pot`, `Lamp`, `Iron Animals`, `Sofa`, `Polygon`, `Armchair`, `Black Armchair`, `Light`, `Pillow`, `Oak Tray`, `Transform`.
- `https://www.luciastuy.com/wp-json/wp/v2/product?per_page=100&_fields=id,slug,title,featured_media` returned the same 15 product titles with `featured_media` IDs `1216` through `1247`.
- `https://www.luciastuy.com/wp-json/wp/v2/media?include=1216,1218,1221,1223,1226,1228,1230,1232,1234,1236,1239,1241,1243,1245,1247&_fields=id,source_url` returned `[]`.
- `https://www.luciastuy.com/wp-json/wp/v2/media/1216?_fields=id,source_url,alt_text,status` returned `404 rest_post_invalid_id`.

How it connects:

- The remote shop is WooCommerce running under the production `Glacier` snapshot documented in `thoughts/shared/docs/woocommerce-audit.md`.
- The current remote product set matches the legacy/demo product shape already observed in the local parity work rather than the `LA-2026-*` artwork source.

### Live Catalog Source

What it does:

- The live Google Sheet remains the source of canonical artwork rows and catalog job history.
- The live workbook contains 20 `LA-2026-*` artwork rows with `image_main` Drive URLs and `image_id_manual` values.
- The same workbook contains recent PDF catalog jobs in `catalog_jobs`.

Evidence:

- Google Drive metadata for spreadsheet `15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw`:
  - title: `Lucia Astuy - CATALOGO_BASE`
  - MIME type: `application/vnd.google-apps.spreadsheet`
  - modified time: `2026-05-01T15:19:14.258Z`
- The fetched workbook content showed canonical artwork rows `LA-2026-001` through `LA-2026-020`.
- The fetched workbook content showed Drive image IDs such as:
  - `LA-2026-002` / `Perrete en tablillas 01` / `1iXk0UatWTazyXYKq2DXNuygu4F-H-hWX`
  - `LA-2026-004` / `More human than human` / `1JmAftoLlWkulR3QccyIvHFfCvWhiVPzs`
  - `LA-2026-017` / `La casita en el mar` / `1cl7B9W-lzlAq8kBGMS1rdVUXoU1rED1z`
- The fetched `catalog_jobs` content showed completed jobs:
  - `catalog_20260501_113219_5614`, `result_artwork_count = 14`
  - `catalog_20260501_120151_899f`, `result_artwork_count = 14`
  - `catalog_20260501_145021_ab4c`, `result_artwork_count = 14`
  - `catalog_20260501_145137_9d09`, `result_artwork_count = 14`, title `demo con clienta`

Code references:

- `thoughts/shared/docs/artwork-data-contract.md:11-24` defines `artwork_id`, `title_clean`, `status_normalized`, `image_main`, `include_in_catalog`, and `catalog_ready`.
- `thoughts/shared/docs/artwork-data-contract.md:48-56` states that the Google Sheet canonical artwork rows are the source for artwork identity/display fields and that production WooCommerce writes require an explicit production task, backup, and rollback path.
- `catalog-generator/data/CATALOGO_BASE.csv:1-21` is the local CSV snapshot with 20 `LA-2026-*` rows and populated `image_main` values.

How it connects:

- The Sheet feeds the PDF catalog generator and its job queue.
- The Sheet is not currently mirrored into remote WooCommerce products or media by any implemented repo code.

### Catalog PDF Generation Path

What it does:

- The generator reads CSV/sheet rows, filters to `include_in_catalog && catalog_ready`, converts Drive file URLs to `lh3.googleusercontent.com/d/<id>`, renders artwork pages, then outputs a PDF.
- The local catalog agent claims queued jobs, reads the selected sheet rows, merges them into CSV, renders the PDF, uploads it to Drive, and writes result metadata back to `catalog_jobs`.

Code references:

- `catalog-generator/src/catalog-generator.mjs:242-258` normalizes Google Drive file links into image URLs for rendering.
- `catalog-generator/src/catalog-generator.mjs:333-359` filters included/ready rows, builds artwork data, carries `imageUrl`, and drops rows missing title or image URL.
- `catalog-generator/src/template.js:100-118` renders each artwork page with `<img class="artwork-image" src="...">`.
- `catalog-generator/catalog-agent/src/agent.mjs:98-147` reads selected sheet rows, merges them to CSV, and calls `generateCatalog`.
- `catalog-generator/catalog-agent/src/agent.mjs:160-183` uploads the generated PDF to Drive and writes `result_file_id`, `result_file_url`, and `result_artwork_count`.
- `thoughts/shared/docs/google-sheets-catalog-action.md:5-14` documents the bound Apps Script plus local `catalog-agent` split.
- `thoughts/shared/docs/google-sheets-catalog-action.md:91-112` documents PDF job scope/status/review fields.

How it connects:

- This path explains why the last catalog jobs can have artwork photos even while the remote shop does not.
- The output target of this path is a Drive PDF, not WooCommerce product/media records.

### WordPress Catalog Console

What it does:

- The owned MU plugin adds a WordPress admin console for catalog PDF jobs.
- It calls the Apps Script API for `queue_catalog_job`, `get_catalog_job`, `list_recent_catalog_jobs`, and `record_catalog_review`.
- It stores API URL/token/profile defaults outside tracked files.

Code references:

- `wordpress/wp-content/mu-plugins/lucia-catalog-console.php:23-66` resolves console runtime config.
- `wordpress/wp-content/mu-plugins/lucia-catalog-console.php:274-347` posts server-side requests to the Apps Script API.
- `wordpress/wp-content/mu-plugins/lucia-catalog-console.php:384-465` implements the AJAX handlers for queue, job lookup, recent jobs, and review.
- `catalog-generator/apps-script/Code.gs:67-118` routes the Apps Script Web App API actions.
- `catalog-generator/apps-script/Code.gs:185-255` creates `catalog_jobs` rows with PDF output fields.
- `catalog-generator/apps-script/Code.gs:367-407` discovers compatible catalog tabs by required headers.
- `catalog-generator/apps-script/Code.gs:470-510` resolves selected/current/all-compatible sheet scopes.

How it connects:

- The production WordPress console can queue a PDF job, but its API actions are scoped to PDF job lifecycle and review state.
- The console does not create or update WooCommerce products, product images, or media attachments.

### WooCommerce Inventory/Media Sync Code

What it does:

- The repository has read-only parity tooling and a pure product draft mapper.
- The parity tooling compares sheet artwork titles to WooCommerce products.
- The draft mapper can build local product-shaped data from sheet rows, including `imageUrl`, SKU, status, stock policy, and metadata.

Code references:

- `catalog-generator/src/commerce-inventory-parity.mjs:71-91` parses sheet inventory rows and supports `all`, `catalog_ready`, and `available` scopes.
- `catalog-generator/src/commerce-inventory-parity.mjs:94-123` parses WooCommerce product CSV rows and compares by normalized title.
- `catalog-generator/src/commerce-inventory-parity.mjs:125-160` builds WooCommerce product drafts, including `imageUrl: row.image_main`, SKU from `artwork_id`, status policy, and Lucia metadata.
- `scripts/wp-inventory-parity.mjs:46-76` is a read-only CLI wrapper around the parity report.
- `thoughts/shared/plans/2026-05-01-woocommerce-catalog-sheet-sync/findings.md:27-32` records the current baseline and the pure draft mapper.
- `PROJECT_STATUS.md:35-38` records that the local baseline is out of sync and that the production PDF console was validated with a 14-artwork completed job.
- `PROJECT_STATUS.md:55-56` records inventory sync as the active blocker and names the next local-only sync step as turning tested drafts into a dry-run/apply importer.
- `thoughts/shared/research/2026-05-01-woocommerce-sheet-catalog-mirror.md:200-216` records that there is no current Sheet -> WooCommerce product create/update path and no current WooCommerce media attachment/import pipeline.

How it connects:

- The existing product draft data includes `imageUrl`, but no current code writes those drafts to WooCommerce.
- The current implemented path is evidence/audit/draft mapping, not production mutation.

## Architecture Notes

- Current catalog source of truth: Google Sheet / canonical CSV contract.
- Current PDF path: Sheet -> `catalog_jobs` -> local `catalog-agent` -> merged CSV -> HTML/PDF -> Drive upload.
- Current WordPress console path: WordPress admin -> Apps Script Web App -> `catalog_jobs` -> local `catalog-agent`.
- Current WooCommerce product state on the remote site: 15 legacy/demo products, zero Store API images per product, placeholder images in shop HTML.
- Current catalog artwork state: 20 `LA-2026-*` source rows, populated `image_main` values, 14-artwork completed PDF jobs.
- Current repo-owned WordPress code does not contain a production product/media importer.
- Current public WordPress product posts have stale/nonresolving `featured_media` IDs: product records expose IDs, but the corresponding public media API query returns no media records.

## Open Questions

- Are the nonresolving remote `featured_media` IDs remnants of deleted attachments, inaccessible private attachments, or database/media-library drift?
- Is the intended shop source all 20 canonical `LA-2026-*` rows, only the 14 current catalog-ready PDF rows, or another subset?
- Should WooCommerce product images be imported into WordPress media attachments, or should products reference externally hosted Google/Drive-derived image URLs?
- Which production WooCommerce fields, if any, are currently authoritative and must be preserved when catalog-source data is mirrored?
- Does the remote shop need to keep the existing legacy/demo products for any reason, or are they only snapshot/demo inventory?

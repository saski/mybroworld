# Catalog Client Feedback Implementation Plan

## Goal

Implement the client feedback received on 2026-05-01 for the PDF catalog while keeping the Google Sheet and WordPress catalog console workflow intact.

## Accepted Client Decisions

- The customer will manually choose the catalog image by naming one existing image per artwork with a filename ending in `_cat`.
- Do not generate, copy, or infer `_cat` files automatically.
- PDF catalog inclusion is controlled by `include_in_catalog` (header on each canonical year tab; column **B** immediately after `preview` in **A**, validated live 2026-05-04).
- Availability/status is not the catalog inclusion source. A work may be available and excluded, or unavailable and included, when `include_in_catalog` says so.
- Catalog ordering is newest first.
- Each artwork page shows only:
  - artwork title
  - production year
  - dimensions
  - technique
  - PVP price
- Remove all other artwork-page copy from the PDF catalog unless the customer reintroduces it.
- Move the metadata block directly under the image, with whitespace similar to the side margin around the image.
- The current cover image is approved.
- Follow-up decision on 2026-05-04: do not print a derived month/year period on the cover; the cover caption shows the catalog title only.
- Closing page contact details:
  - `hola@luciastuy.com`
  - `635.166.253`
  - `IG: @luciastuy`
  - `www.luciastuy.com`
- Gotham fonts and logo PNGs are reported to be in `https://drive.google.com/drive/folders/1J98-QwFiEkRu99BLjvEbfE_J3C5FxRy9`.

## Current Access Note

The Google Drive connector available in this session was authenticated as
`ignacio.viejo@eventbrite.com` and returned no files for:

- image-selection folder: `https://drive.google.com/drive/folders/1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh`
- fonts/logos folder: `https://drive.google.com/drive/folders/1J98-QwFiEkRu99BLjvEbfE_J3C5FxRy9`

The local catalog-agent OAuth token for `mybrocorp@gmail.com` was then used to
verify access. The assets folder contains the official PNG logos and Gotham font
files, which were copied into `catalog-generator/assets/`. The image-selection
folder currently has 51 files and 0 `_cat` candidates, so production must not
enable strict `_cat` selection until the customer renames one image per included
artwork.

## Implementation Slices

### 1. Contract And Tests

- Status: Done.
- Added coverage for `include_in_catalog` filtering, newest-first ordering, reduced artwork metadata, PVP display, final contact details, `_cat` manifest use, embedded brand assets, Drive folder listing, and per-job image manifest materialization.

### 2. Catalog Data Rules

- Status: Done.
- The generator filters by `include_in_catalog` and `catalog_ready`, sorts by `date_label`/year newest first, and uses `catalog_order` as a tie-breaker.
- PVP price comes from `price_display_clean` with `price_eur` as a fallback.

### 3. `_cat` Image Resolution

- Status: Implemented, not yet enabled in production.
- The generator accepts `--catalog-image-manifest`/`CATALOG_IMAGE_MANIFEST` and matches `_cat` filenames by `artwork_id` first, then title slug.
- The catalog-agent can build a per-job manifest from the optional config field `catalogImageFolderId`.
- Missing or duplicate `_cat` matches fail with `catalog_image_selection_blocked`.
- Production should enable `catalogImageFolderId` only after the customer creates one `_cat` image per included, catalog-ready artwork.

### 4. Layout Update

- Status: Done.
- The metadata block now sits immediately below the image with controlled whitespace.
- Status labels, public notes, location/history, section labels, and non-PVP variants are removed from artwork pages.

### 5. Assets

- Status: Done locally.
- Downloaded Gotham font files and official PNG logos from the shared Drive folder using the `mybrocorp@gmail.com` OAuth token.
- The PDF HTML embeds the required Gotham weights and official logos as data URIs for portable rendering in local and Cloud Run environments.
- If this repository is ever published outside the controlled project, font redistribution/licensing should be reviewed first.

### 6. Verification

- Status: Done for the implemented scope.
- Targeted tests pass for the implemented feedback slices.
- Full test suite passed with `npm --prefix catalog-generator test`.
- Local PDF generated at `catalog-generator/output/catalog-client-feedback.pdf` with 14 artworks and 16 pages.
- Visual spot checks confirmed the approved cover, reduced artwork metadata, PVP price, official logos, and final contact details.
- Cloud Build `3a166760-02a0-4c83-a29e-f5677bf3d433` built and pushed the updated worker image.
- Cloud Run Job `lucia-mybrocorp-catalog-agent` was updated and manual execution `lucia-mybrocorp-catalog-agent-bblht` completed successfully, authenticating as `mybrocorp@gmail.com` and finding no queued jobs.

## Open Questions

- Resolved: `_cat` filenames map by `artwork_id_cat` first and title slug second.
- Resolved: `catalog_ready = FALSE` continues to block technically incomplete rows.
- Resolved: approved logos and Gotham files live under `catalog-generator/assets/` so local and Cloud Run renders are portable.
- Pending: customer must create `_cat` image files before strict image-folder selection can be enabled in production.

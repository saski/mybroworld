# Artwork Data Contract

## Objective

Define the canonical artwork fields shared by the WooCommerce custom layer and the catalog generator before any sync logic is introduced.

## Canonical Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `artwork_id` | string | yes | Stable unique identifier such as `LA-2026-004`. |
| `title_clean` | string | yes | Public title used in WordPress and the catalog. |
| `series_name` | string | optional | Shared series label when the artwork belongs to a series; leave empty for standalone works. |
| `year` | string | yes | Display year, preserved as text. |
| `medium_clean` | string | recommended | Public-facing medium. |
| `support_clean` | string | recommended | Public-facing support material. |
| `dimensions_clean` | string | recommended | Public-facing formatted dimensions. |
| `status_normalized` | enum | yes | Canonical availability state after normalization. |
| `location_clean` | string | optional | Current location or holder only, such as `El Grifo` or `Juan Roller`. Do not store multi-step routes here. |
| `location_history` | string | optional | Ordered route history stored as one text field with ` -> ` between steps, for example `Residencia Escala House 07.01/20.02 -> El Grifo -> Juan Roller`. |
| `price_display_clean` | string | conditional | Canonical PVP display price. WooCommerce shows it only when the artwork is `available` and `show_price` is true; PDF catalogs show it for included catalog works. |
| `image_main` | string | yes | Primary public image URL. |
| `include_in_catalog` | boolean | yes | Gate for catalog inclusion. |
| `catalog_ready` | boolean | yes | Gate for catalog inclusion after QA. |
| `catalog_section` | string | optional | Explicit section override; defaults from status rules. |
| `catalog_order` | integer | optional | Sort order inside the selected section. |
| `show_price` | boolean | optional | Additional guard for public price display. |
| `catalog_notes_public` | string | optional | Public note shown in the catalog when needed. |
| `submission_history` | string | optional | Optional artwork submission history stored as one text field with `; ` between entries, for example `GBK Dusseldorf 2026; Fanzimad 2026`. |

## PDF Catalog Client Decisions

These decisions come from client feedback on 2026-05-01 and override earlier open catalog questions.

- PDF catalog editorial inclusion is controlled by `include_in_catalog` (column L in the live sheet), not by `status_normalized` or availability wording. A work can be available and excluded, or unavailable and included, when column L says so.
- `catalog_ready` remains a technical QA gate for rows that are incomplete or unsafe to render, but it is not the editorial selection field.
- The customer will manually choose the catalog image for each artwork by keeping one image whose filename ends in `_cat`. Do not generate, copy, or infer `_cat` images automatically unless the customer later approves that workflow.
- If catalog image resolution is automated later, use the existing `_cat` file only. Missing or multiple `_cat` matches for one artwork should be reported as blockers instead of guessed.
- Catalog ordering should be newest first. Prefer production year or date metadata descending; use explicit `catalog_order` only as a tie-breaker or override when the customer adds it deliberately.
- Each artwork page should show only: artwork title, production year, dimensions, technique, and PVP price.
- The PDF catalog should not show public notes, location/history, availability labels, section labels, or non-PVP price variants unless the customer explicitly reintroduces them.
- The current cover image is approved.
- Final closing-page contact details:
  - `hola@luciastuy.com`
  - `635.166.253`
  - `IG: @luciastuy`
  - `www.luciastuy.com`
- Gotham fonts and logo PNGs were verified from the shared Drive folder `https://drive.google.com/drive/folders/1J98-QwFiEkRu99BLjvEbfE_J3C5FxRy9` through the `mybrocorp@gmail.com` OAuth token and copied into `catalog-generator/assets/` for portable PDF rendering.

## Field Modeling Notes

- The canonical contract is header-based, not position-based. Any compatible yearly tab may reorder columns for editing ergonomics as long as canonical header names stay unchanged.
- A workbook may contain multiple yearly canonical tabs, such as `2026`, `2025`, or `2024`, that all follow the same header contract.
- Integrations must not assume a fixed tab name such as `Sheet1`. They should accept explicit tab scope or detect compatible tabs from their headers.
- `preview` is a sheet-only helper column used for in-cell thumbnails in Google Sheets. It is not part of the canonical business contract, and downstream repo code must ignore it.
- CSV exports from a canonical yearly sheet may include the leading `preview` helper column. The catalog generator remains compatible because it parses rows by header name and ignores extra columns it does not consume.
- `series_name` is an optional canonical field for grouping related artworks without changing their public titles.
- `location_clean` remains the single current location or current holder field.
- `location_history` is the dedicated canonical field for chronological route history and must not be collapsed back into `location_clean`.
- When both are present, the final step in `location_history` should normally match `location_clean`.
- `submission_history` is the initial canonical implementation for contest and open-call history.
- The first version remains a single optional text field rather than a normalized submission model.
- In any canonical yearly tab, `submission_history` must keep its canonical header name, but its physical column position may move with other editing-oriented layout changes.

## Commerce Sync Notes

- The Google Sheet canonical artwork rows are the current source for artwork identity and display fields used by PDF catalog generation and WooCommerce inventory sync planning.
- WooCommerce inventory should contain all canonical sheet artworks. PDF catalog generation may use a subset of rows through `include_in_catalog` and `catalog_ready`, but WooCommerce inventory scope is not limited by those catalog flags.
- Use `artwork_id` as the stable cross-system identity for future WooCommerce product import/update work. Title matching is acceptable only for the current read-only parity audit because existing local WooCommerce products do not yet carry `artwork_id` metadata.
- Managed WooCommerce artwork products must carry the same `artwork_id` in both the product SKU and `_lucia_artwork_id` product meta. Sync tooling should match managed products by these identity fields, not by product title.
- WooCommerce products that do not carry a canonical `LA-YYYY-NNN` SKU or `_lucia_artwork_id` are unmanaged by the catalog sync. The sync may report them as unexpected, but it must not delete or hide them unless an explicit cleanup mode is requested.
- Product source rows with missing `artwork_id`, missing `title_clean`, unknown `status_normalized`, or missing `image_main` are invalid for product writes and must be fixed in the source before sync apply.
- `status_normalized` controls WooCommerce storefront behavior:
  - `available` artworks are visible and purchasable.
  - Non-available historical statuses are visible but not purchasable.
  - `archived` artworks remain in WooCommerce inventory but are hidden and not purchasable.
- Local look-and-feel parity with the remote shop is snapshot-based through the imported production `glacier` runtime; inventory parity is a separate data sync concern.
- Do not write inventory changes to production WooCommerce without an explicit production task, backup, and rollback path.

## Canonical Status Enum

Allowed normalized values:
- `available`
- `gifted`
- `exchanged`
- `sold`
- `commissioned`
- `reserved`
- `not_for_sale`
- `personal_collection`
- `archived`

## Normalization Rules

Input values are trimmed, lowercased, and normalized to underscore-separated tokens before mapping.

| Canonical value | Accepted aliases |
|---|---|
| `available` | `available`, `for_sale`, `for sale`, `disponible` |
| `gifted` | `gifted`, `gift`, `regalo`, `donated`, `donation` |
| `exchanged` | `exchanged`, `exchange`, `intercambio`, `traded` |
| `sold` | `sold`, `vendido` |
| `commissioned` | `commissioned`, `commission`, `encargo` |
| `reserved` | `reserved`, `reservado`, `reservada` |
| `not_for_sale` | `not_for_sale`, `not for sale`, `nfs`, `no_disponible` |
| `personal_collection` | `personal_collection`, `personal collection`, `collection`, `coleccion_personal` |
| `archived` | `archived`, `archive`, `archivada` |

Unknown values remain empty for display logic and should be corrected in source data before sync work begins.

## Display Rules

- `gifted`, `exchanged`, `personal_collection`, and `archived` map to the public label `Obra histórica`.
- `reserved` maps to the public label `Reservada`.
- `sold`, `commissioned`, and `not_for_sale` map to the public label `Obra no disponible`.
- `available` has no status label.
- Catalog section defaults to `available` only for `available` artworks; every other normalized status defaults to `historical`.
- WooCommerce public price display is allowed only when `status_normalized` is `available` and `show_price` is true.
- PDF catalog price display follows the client-approved catalog rule: included catalog works show only the PVP price, with no availability/status label.

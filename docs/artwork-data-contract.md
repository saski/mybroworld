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
| `price_display_clean` | string | conditional | Only shown when the artwork is `available` and `show_price` is true. |
| `image_main` | string | yes | Primary public image URL. |
| `include_in_catalog` | boolean | yes | Gate for catalog inclusion. |
| `catalog_ready` | boolean | yes | Gate for catalog inclusion after QA. |
| `catalog_section` | string | optional | Explicit section override; defaults from status rules. |
| `catalog_order` | integer | optional | Sort order inside the selected section. |
| `show_price` | boolean | optional | Additional guard for public price display. |
| `catalog_notes_public` | string | optional | Public note shown in the catalog when needed. |
| `submission_history` | string | optional | Optional artwork submission history stored as one text field with `; ` between entries, for example `GBK Dusseldorf 2026; Fanzimad 2026`. |

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
- Public price display is allowed only when `status_normalized` is `available` and `show_price` is true.

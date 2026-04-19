# Artwork Data Contract

## Objective

Define the canonical artwork fields shared by the WooCommerce custom layer and the catalog generator before any sync logic is introduced.

## Canonical Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `artwork_id` | string | yes | Stable unique identifier such as `LA-2026-004`. |
| `title_clean` | string | yes | Public title used in WordPress and the catalog. |
| `year` | string | yes | Display year, preserved as text. |
| `medium_clean` | string | recommended | Public-facing medium. |
| `support_clean` | string | recommended | Public-facing support material. |
| `dimensions_clean` | string | recommended | Public-facing formatted dimensions. |
| `status_normalized` | enum | yes | Canonical availability state after normalization. |
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

- `submission_history` is the initial canonical implementation for contest and open-call history.
- The first version remains a single optional text field rather than a normalized submission model.
- In `Sheet1`, the `submission_history` column must be appended at the end of the sheet to avoid disturbing existing column references and manual workflows.

## Canonical Status Enum

Allowed normalized values:
- `available`
- `gifted`
- `exchanged`
- `sold`
- `commissioned`
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
| `not_for_sale` | `not_for_sale`, `not for sale`, `nfs`, `no_disponible` |
| `personal_collection` | `personal_collection`, `personal collection`, `collection`, `coleccion_personal` |
| `archived` | `archived`, `archive`, `archivada` |

Unknown values remain empty for display logic and should be corrected in source data before sync work begins.

## Display Rules

- `gifted`, `exchanged`, `personal_collection`, and `archived` map to the public label `Obra histórica`.
- `sold`, `commissioned`, and `not_for_sale` map to the public label `Obra no disponible`.
- `available` has no status label.
- Catalog section defaults to `available` only for `available` artworks; every other normalized status defaults to `historical`.
- Public price display is allowed only when `status_normalized` is `available` and `show_price` is true.

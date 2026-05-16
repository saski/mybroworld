# Metadata source mapping — portfolio items

**Date:** 2026-05-16  
**Discovery method:** `wp post meta list <post_id>` on local production snapshot (WP-CLI)

Metadata is **not** exposed via public REST (`acf` empty, `meta` only Visual Portfolio keys). Live Glacier renders values from **legacy ACF field keys** stored as post meta. Labels are **per-item** (title fields), not fixed Spanish keys in the database.

## Shared field keys (both items)

| Meta key | Role |
|----------|------|
| `gallery_projects` | Serialized array of attachment post IDs (ordered gallery) |
| `visible_details` | `show` when metadata block should render |
| `column_single` / `single_variants_styles` | Glacier layout variant (`one` for these samples) |
| `author_title` + `author` | Metadata row 1 label + value |
| `client_name_title` + `client_name` | Metadata row 2 label + value |
| `project_date_title` + `project_date` | Metadata row 3 label + value |
| `project_location_title` + `project_location` | Metadata row 4 label + value |

Companion `_*` keys are ACF field-key references; ignore for rendering.

## Item 1: `supergreat` (post ID 2397)

| Label (stored) | Value | Spec alias |
|----------------|-------|------------|
| Págs | 20 | PÁGS |
| Tamaño | A5 | TAMAÑO |
| Impresión | Impreso en risografía por AnotherPress. | IMPRESIÓN |
| Fecha | Febrero 2024 | FECHA |

**Gallery attachments:** `2379`, `2380`, `2381` →  
`fanzine_Supergreat-01.jpg`, `-02.jpg`, `-03.jpg` under `uploads/2024/02/`.

**Post content (`the_content`):** single paragraph — `Fanzine de cómic/ilustración.` (description only).

## Item 2: `super-supergreat` (post ID 2436)

| Label (stored) | Value | Notes |
|----------------|-------|-------|
| Tamaño | 65x54cm | Not the same row set as `supergreat` |
| Técnica | Acrílico, spray, grafito y ceras sobre lienzo. | Reuses `client_name_*` keys |
| Fecha | Enero 2024 | |
| Project location | California, USA | English label in DB |

**Gallery attachments:** six IDs (`2438`–`2443`).

## Rendering rules for owned template

1. Read up to four `(title_meta, value_meta)` pairs in order:  
   `(author_title, author)`, `(client_name_title, client_name)`, `(project_date_title, project_date)`, `(project_location_title, project_location)`.
2. Skip a row when **both** label and value are empty after trim.
3. Skip a row when `visible_details` is not `show`.
4. Do **not** assume labels are always PÁGS/TAMAÑO/IMPRESIÓN/FECHA; treat spec names as examples. Parity target is **live label text + value rhythm**, not fixed key names.
5. Build gallery from `gallery_projects` attachment IDs; fall back to featured image only if gallery empty.
6. Adjacent navigation: use `portfolio` post type menu order or published-date ordering (match live adjacency: for `supergreat`, prev → `super-supergreat`, next → `time`).

## Open question (resolved for planning)

- **Sticky info column on desktop:** defer to implementation; not required for acceptance in planning phase. Default: non-sticky unless screenshot diff shows sticky behavior on live.

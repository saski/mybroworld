# Implementation plan — catalog item parity

Planning output for tasks 2.x–4.x. Code changes belong in a **follow-up implementation pass** (same spec, new task section or child change).

## 2. Template and data mapping

### 2.1 Template file strategy

| File | Purpose |
|------|---------|
| `wordpress/wp-content/themes/luciastuy/single-portfolio.php` | Primary single-item template; only loads for `portfolio` post type |
| `wordpress/wp-content/themes/luciastuy/inc/portfolio-item.php` (or similar) | Pure PHP helpers: meta rows, gallery IDs, adjacent posts |
| `wordpress/wp-content/themes/luciastuy/assets/portfolio-item.css` | Scoped styles under `.luciastuy-portfolio-item` |
| `wordpress/wp-content/themes/luciastuy/assets/portfolio-item.js` | Light overlay + keyboard focus (minimal) |

**Fallback:** if `single-portfolio.php` is missing, WordPress falls back to `singular.php` / `index.php` — current broken state. No silent fallback to generic article layout once template exists.

**Enqueue:** load portfolio CSS/JS only on `is_singular('portfolio')`.

### 2.2 Field-to-UI mapping

| UI region | Source | Fallback |
|-----------|--------|----------|
| Title | `get_the_title()` | — |
| Description | `get_the_content()` (filtered) | Hide block if empty |
| Metadata rows | Four meta pairs (see [metadata-source-mapping.md](./evidence/metadata-source-mapping.md)) | Skip empty pairs; hide entire panel if zero rows |
| Gallery | `gallery_projects` attachment IDs | Featured image only; if none, omit media column |
| Prev/next | Adjacent published `portfolio` posts by `menu_order` then `date` | Hide nav section if no neighbor |

### 2.3 Previous/next navigation

- Markup: `.luciastuy-portfolio-item__nav` with `rel="prev"` / `rel="next"`.
- Labels: match live copy — `Prev project` / `Next project` with chevron icons (CSS or inline SVG; no Font Awesome dependency).
- Order: `menu_order` ASC, `date` DESC (matches live prev/next for `supergreat`: prev `super-supergreat`, next `time`).

### 2.4 Scoped selectors (WooCommerce non-regression)

- Root namespace: `.luciastuy-portfolio-item` on `<main>` or wrapper.
- **Do not** style bare `.woocommerce`, `.site-main article`, or global `h1` without the namespace.
- Portfolio CSS loads only on `is_singular('portfolio')`; no changes to `woocommerce.php` template.

## 3. Visual and interaction parity

### 3.1 Typography

| Element | Font | Transform / rhythm |
|---------|------|-------------------|
| Item title | `--font-display` (Dosis) | Uppercase, letter-spacing ~2px, size between shop product title and grid overlay |
| Description | `--font-body` (Source Sans Pro) | Normal case, 15px class equivalent |
| Metadata labels (`h5` role) | Dosis | Uppercase, tracked; match live `h5` weight |
| Metadata values (`p`) | Source Sans Pro | Light weight |
| Nav links | Dosis | Uppercase, 11–12px, tracked |

Load only existing `@font-face` rules from `style.css`; no new CDN.

### 3.2 Gallery behavior

- Render ordered `<img>` list with `<button>` or `<a>` wrappers for expand.
- **Lean lightbox:** full-screen overlay on activate, `Escape` closes, focus trap, `aria-expanded` on trigger.
- Hover: subtle opacity or outline on desktop; focus ring for keyboard.
- **Not required:** Fancybox feature parity, social share, slideshow.

### 3.3 Layout / breakpoints

| Breakpoint | Layout |
|------------|--------|
| ≥1200px | CSS grid: ~58% media / ~42% info (match Bootstrap 7/5 split) |
| 992–1199px | Same columns, tighter gutters |
| 768–991px | Optional compressed two-column or stacked with media first |
| <768px | Single column: title → description → metadata → gallery stack → nav |

Spacing: align vertical rhythm with product-detail slice (generous top padding below header, ~2–3rem section gaps).

### 3.4 Header / footer coexistence

- Reuse `luciastuy_render_header()` / `luciastuy_render_footer()` unchanged.
- Portfolio item main starts below existing header; no hero overlap.
- Footer unchanged; ensure gallery/lightbox `z-index` stays below mobile menu if open.

## 4. Validation plan

### 4.1 Screenshot acceptance set

| Slug | Viewports | Labels |
|------|-----------|--------|
| `supergreat` | desktop, tablet, mobile | `live-*` vs `luciastuy-local-*` |
| `super-supergreat` | desktop, mobile | Second shape / metadata variance |

Output directory pattern: `wordpress/.tmp/visual-baseline/YYYY-MM-DD-catalog-item-<slug>/`.

### 4.2 Interaction checks

| Check | Method |
|-------|--------|
| Gallery activate / close | Manual or extend `woo-interaction-baseline.mjs` with optional portfolio path |
| Keyboard focus on gallery controls | Tab through triggers; overlay dismiss with Escape |
| Menu active state on portfolio | Existing header interaction baseline |
| Prev/next links resolve | HTTP 200 on neighbor URLs |

### 4.3 Non-regression paths

Run existing baselines unchanged:

- `/`
- `/shop/` + first product
- `/cart/`
- `/checkout/`

Commands: `scripts/woo-visual-baseline.mjs`, `scripts/woo-interaction-baseline.mjs` at `http://localhost:8090`.

### 4.4 Pass/fail criteria

**Pass** when, for `supergreat` and `super-supergreat`:

1. All parity checklist rows marked PASS or documented exception.
2. Screenshot diff: layout regions present (media, metadata, nav) at all three viewports.
3. Interaction checks: zero failures.
4. WooCommerce non-regression: zero new failures vs pre-change interaction report.

**Exceptions log:** append rows to [parity-checklist.md](./evidence/parity-checklist.md) table “Allowed exceptions”.

**Fail** if any FAIL row remains without an approved exception.

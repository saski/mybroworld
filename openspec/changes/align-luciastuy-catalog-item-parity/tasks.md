## 1. Exploration And Baseline

- [x] 1.1 Capture fresh live vs local screenshots for `/portfolio/supergreat/` at desktop, tablet, and mobile.
- [x] 1.2 Record DOM structure differences for single item pages (template wrappers, media blocks, metadata blocks, bottom nav blocks).
- [x] 1.3 Identify where item metadata currently lives for at least two portfolio items (`PÁGS`, `TAMAÑO`, `IMPRESIÓN`, `FECHA`).
- [x] 1.4 Document current local rendering gaps with a parity checklist linked to screenshot evidence.

## 2. Template And Data Mapping Plan

- [x] 2.1 Define the owned template file strategy for single portfolio pages (new template(s) and fallback path).
- [x] 2.2 Define field-to-UI mapping and fallback behavior for missing metadata values.
- [x] 2.3 Define previous/next item navigation behavior and label treatment.
- [x] 2.4 Confirm scoped selectors/namespaces to avoid regressions on WooCommerce surfaces.

## 3. Visual And Interaction Parity Plan

- [x] 3.1 Specify typography rules for item title, description, labels, values, and nav controls (Dosis/Source Sans Pro parity).
- [x] 3.2 Specify gallery rendering and interaction behavior (hover, click, keyboard focus, optional lightbox behavior).
- [x] 3.3 Specify desktop/tablet/mobile layout behavior and spacing cadence.
- [x] 3.4 Specify footer and header coexistence expectations on item pages after template changes.

## 4. Validation Plan

- [x] 4.1 Define screenshot acceptance set: live vs local for `supergreat` plus one additional slug.
- [x] 4.2 Define interaction checks for image interaction, menu active state, and previous/next item navigation.
- [x] 4.3 Define non-regression checks for `/`, `/shop/`, one product, `/cart/`, `/checkout/`.
- [x] 4.4 Define explicit pass/fail criteria and allowed exceptions log format.

## 5. Delivery Readiness

- [x] 5.1 Confirm this change is ready for `/opsx:apply align-luciastuy-catalog-item-parity`.
- [x] 5.2 Link this change back to roadmap execution tracking before implementation starts.

## 6. Implementation

- [x] 6.1 Add `inc/portfolio-item.php` helpers (metadata, gallery, adjacent links).
- [x] 6.2 Add `single-portfolio.php` with two-column desktop layout and mobile stack order.
- [x] 6.3 Add scoped `assets/portfolio-item.css` and `assets/portfolio-item.js` (lightbox).
- [x] 6.4 Enqueue portfolio assets only on `is_singular('portfolio')`.
- [x] 6.5 Verify local render for `supergreat` and `super-supergreat`; capture screenshots under `wordpress/.tmp/visual-baseline/2026-05-16-catalog-item-supergreat-after/`.
- [x] 6.6 Run `scripts/wp-test-owned-code.sh` (pass).

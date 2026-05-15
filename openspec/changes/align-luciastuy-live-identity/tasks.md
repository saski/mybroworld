## 1. Exploration And Baseline

- [x] 1.1 Capture current production `/` desktop and mobile screenshots focused on hero video, logo placement, navigation, heading visibility, gallery start, and footer.
- [x] 1.2 Capture current local `luciastuy` `/` desktop and mobile screenshots with the same viewport sizes and output naming convention.
- [x] 1.3 Record a live-vs-local DOM/style snapshot for navigation typography, visible headings, footer text, logo image dimensions, and hero/video selectors.
- [x] 1.4 Record the original live theme font family, font source, visible loaded font files, fallback stack, sizes, letter spacing, and text transforms for affected identity surfaces.
- [x] 1.5 Record the original live theme interaction behavior for header links, logo home link, hero/video controls, navigation hover/focus states, gallery/product clicks, cart entry point, mobile menu behavior, and footer links.
- [x] 1.6 Decide and document whether the implementation uses a locally versioned logo asset, a WordPress media URL, or both with fallback.
- [x] 1.7 Decide and document whether the video embed should use `youtube.com` or `youtube-nocookie.com`, and whether autoplay is required or progressive enhancement.
- [x] 1.8 Decide which original-theme interactions are mandatory for acceptance and which simplifications are allowed.

## 2. Safety Checks Before Theme Edits

- [x] 2.1 Run `scripts/wp-test-owned-code.sh` before editing theme code and record failures or skipped checks.
- [x] 2.2 Run the current local interaction baseline for `luciastuy` to preserve navigation, cart, product, checkout, and buyer-field behavior.
- [x] 2.3 Add or extend the smallest automated assertion that can detect the intended home hero, logo overlay, font parity, footer parity, interaction parity, or heading behavior before implementation.

## 3. Home Hero And Logo Overlay

- [x] 3.1 Add a front-page-only owned theme hero component for the Lucia Astuy video reference without introducing a plugin or page-builder dependency.
- [x] 3.2 Add the Lucia Astuy graphic logo overlay using the approved asset source and an owned fallback.
- [x] 3.3 Style the hero for desktop and mobile crop/height behavior so the gallery/shop content begins below the hero without overlap.
- [x] 3.4 Verify that navigation, logo link, video controls or autoplay fallback, and cart controls mimic the original live theme on desktop and mobile.

## 4. Fonts, Typography, Interaction, And Heading Treatment

- [x] 4.1 Apply the original live theme font family, fallback stack, sizes, spacing, and text transforms to header navigation, hero area, gallery/product labels, footer, and commerce buttons with scoped CSS.
- [x] 4.2 Implement approved original-theme interaction behavior for hover, focus, click, responsive menu, gallery/product entry, cart affordance, and footer links without copying builder scripts.
- [x] 4.3 Remove, visually hide, or restyle scaffold-like home headings so they no longer dominate the front page.
- [x] 4.4 Preserve semantic headings required for accessibility while keeping the visual treatment aligned with the live identity.
- [x] 4.5 Verify that product, cart, and checkout headings remain readable and do not regress from the previous shop-readiness baseline.

## 5. Footer Alignment

- [x] 5.1 Replace the minimal local footer with the approved original-theme footer content, layout, typography, spacing, Instagram link, and compact Lucia Astuy copyright identity line.
- [x] 5.2 Ensure the footer renders consistently on home, shop, product, cart, and checkout surfaces without plugin badges or builder artifacts.
- [x] 5.3 Confirm footer links, hover/focus states, and text are keyboard accessible and readable on mobile.

## 6. Post-Glacier Plugin And Extension Cleanup Notes

- [x] 6.1 Review `thoughts/shared/docs/woocommerce-audit.md`, `thoughts/shared/docs/wordpress-plugin-inventory.md`, and `thoughts/shared/docs/wordpress-plugin-removal-log.md` for Glacier-era theme, builder, plugin, and extension dependencies.
- [x] 6.2 Record which dependencies become deletion candidates only after the owned `luciastuy` migration is accepted, including Elementor, Slider Revolution, WPBakery/js_composer, Visual Portfolio, Glacier theme helpers, bundled ACF Pro, or other active production plugins when evidence supports them.
- [x] 6.3 For each candidate, record evidence, affected surfaces, owner decision needed, rollback notes, and the required one-plugin-at-a-time validation path before any deactivation.
- [x] 6.4 Confirm that no plugin or extension is marked safe to delete solely because visual parity passed.

## 7. Validation And Review Gate

- [x] 7.1 Run `scripts/wp-test-owned-code.sh` after implementation.
- [x] 7.2 Run local visual baseline capture for `/`, `/shop/`, one product page, `/cart/`, and `/checkout/` after the identity changes.
- [x] 7.3 Run local interaction baseline with cart mutation enabled and `--require-payment-method` where checkout readiness is being asserted.
- [x] 7.4 Compare before/after evidence and record remaining deltas against production `Glacier` fonts, footer, interactions, and identity.
- [x] 7.5 Update the broader roadmap tracker only after this change is accepted, keeping edits focused on `openspec/changes/plan-catalog-commerce-roadmap/` section `6. Ecommerce Visual Identity` and the existing plugin-safety workstream.

## 8. Iteration 2 Visual Parity Deltas

- [x] 8.1 Replace the current local hero logo with the exact transparent production asset (`logo_oldschool_transp.png`) or a pixel-equivalent local copy with no visible background box.
- [x] 8.2 Match menu typography to production exactly (font family, weight, size, spacing, uppercase/casing, accent rendering for `Catálogo`).
- [x] 8.3 Match footer details to production including spacing rhythm, text copy pattern, and red heart accent in the copyright row.
- [x] 8.4 Match hover overlay title typography on product/portfolio tiles (font, weight, size, letter spacing, alignment, and vertical placement).
- [x] 8.5 Match load-more and commerce button style to production (shape, border radius, fill, border, text treatment, and hover/focus states).
- [x] 8.6 Match header balance details still differing in screenshots: logo scale/offset, nav/cart spacing, and cart icon visual weight.
- [x] 8.7 Match hero playback control look and placement (pause/play affordance prominence and center alignment).
- [x] 8.8 Review grid/layout deltas not yet fixed (tile gutter rhythm, overlay darkness, and section spacing after hero) and document accepted vs rejected differences.
- [x] 8.9 Capture fresh desktop/mobile comparison screenshots after 8.1-8.8 and record remaining visual gaps, if any.
- [x] 8.10 Match cart icon and counter badge styling in header (icon stroke/size, badge fill/shape, badge offset, and numeral typography).
- [x] 8.11 Match footer separator and spacing cadence (top divider visibility, vertical whitespace before Instagram row, and copyright row baseline alignment).
- [x] 8.12 Match mobile parity details still visible in captures (hero crop height, menu/counter spacing at small viewport, and load-more vertical rhythm).

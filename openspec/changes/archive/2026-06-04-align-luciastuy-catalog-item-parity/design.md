## Context

Current local `luciastuy` item pages render a minimal content layout and do not match the live catalog item composition.

From the screenshot baseline (`left=local luciastuy`, `right=live current`):

- Local is missing the dominant image gallery column and appears mostly empty in the primary viewport.
- Local lacks the live right-side metadata rhythm (`PÁGS`, `TAMAÑO`, `IMPRESIÓN`, `FECHA`) and its visual hierarchy.
- Local lacks live-style bottom portfolio navigation flow.
- Spacing, density, and information architecture differ substantially.

## Goals / Non-Goals

**Goals**

- Achieve visual and interaction parity for `/portfolio/{slug}` without introducing non-owned builder dependencies.
- Reproduce the live information architecture: title + description + metadata + media gallery + previous/next navigation.
- Maintain responsive/adaptive rendering across desktop, tablet, and mobile.
- Preserve existing checkout/shop behavior by scoping changes to catalog item templates/styles.

**Non-Goals**

- Production activation in this change.
- Full recreation of legacy builder internals.
- Changes to payment, checkout, or catalog data model outside what item-page rendering needs.

## Design Decisions

### Decision: Introduce a dedicated single-portfolio template in `luciastuy`

The owned theme should implement a dedicated single-item template path instead of relying on generic `index.php` rendering.

Rationale:

- Enables deterministic structure parity for this page only.
- Reduces risk of side effects on other surfaces.

### Decision: Keep metadata rendering resilient to source variability

Metadata values in live pages may come from legacy meta fields, structured blocks, or shortcodes. The owned template should:

- Prefer explicit known meta keys when available.
- Provide guarded fallbacks when a field is missing.
- Avoid rendering broken labels/empty placeholders.

Rationale:

- Supports migration without requiring immediate content-model cleanup.

### Decision: Implement lightweight gallery behavior

The item gallery should support live-like click affordance and keyboard-focusable image interaction with minimal JS/CSS.

Rationale:

- Preserves UX parity while avoiding plugin lock-in.

### Decision: Enforce adaptive layout as a first-class acceptance gate

Breakpoints must preserve hierarchy and readability:

- Desktop: two columns (media + metadata panel).
- Tablet: compressed two-column or stacked variant with readable metadata.
- Mobile: stacked layout with metadata following title/description and accessible media sequence.

Rationale:

- User explicitly requested adaptive behavior for different screen resolutions.

## Risks / Trade-offs

- Live metadata source may be inconsistent across portfolio items.
- Existing pages may not have all metadata fields populated.
- Gallery parity might be visually close but not behavior-identical if legacy plugins currently drive lightbox internals.
- CSS conflicts with global identity styles could regress shop/product pages if selectors are too broad.

## Validation Strategy

- Capture live/local screenshots for one canonical slug (`supergreat`) at desktop + mobile.
- Add at least one additional slug sanity check to detect content-shape variance.
- Validate:
  - header parity remains intact
  - item layout parity (media/info columns)
  - metadata visibility and label rhythm
  - image interaction + keyboard focus states
  - bottom previous/next navigation behavior
  - no regressions on `/shop/`, one WooCommerce product, `/cart/`, `/checkout/`

## Open Questions

- Exact metadata key mapping for `PÁGS`, `TAMAÑO`, `IMPRESIÓN`, `FECHA` in the current content source.
- Whether live image lightbox behavior should be replicated exactly or approximated with a lean accessible overlay pattern.
- Whether right-side info column should be sticky on desktop in the owned implementation.

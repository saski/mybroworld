## Why

The home and grid identity parity work is complete enough to continue, but the catalog item page (`/portfolio/{slug}`) in the owned `luciastuy` theme is still far from the current live experience. In the current comparison, the in-progress page shows only a sparse title/excerpt block and misses the live two-column composition, media stack, metadata panel, and bottom navigation behavior.

This change creates a focused next-stage plan to align the catalog item page with the live reference while keeping implementation lean, responsive, and inside owned theme code.

## What Changes

- Add a focused OpenSpec workstream for **catalog item page parity** between live `Glacier` output and owned `luciastuy` output.
- Define the required target layout for `/portfolio/{slug}`:
  - media-first column with stacked images/gallery
  - right-side information panel with title and metadata rhythm
  - bottom previous/next portfolio navigation block
- Require typography parity using the same original-theme fonts already approved for identity parity (`Dosis` and `Source Sans Pro`) on this page.
- Require interaction parity for image click/expand behavior, nav transitions, keyboard focus states, and responsive behavior.
- Require adaptive behavior across desktop, tablet, and mobile breakpoints.
- Keep implementation in owned theme templates/CSS/JS only; no new builder, gallery, or paid/freemium visual plugin.

## Capabilities

### New Capabilities

- `luciastuy-catalog-item-parity`: Alignment requirements for single catalog/portfolio item pages so the owned theme can replace live presentation behavior for item detail views.

### Modified Capabilities

- `luciastuy-live-identity`: Extended by dependency only; no direct changes in that completed spec.

## Impact

- Affected code: `wordpress/wp-content/themes/luciastuy/`
- Expected files: single item template(s), metadata helpers, page-specific styles, and minimal JS behavior for gallery/navigation parity.
- Validation: screenshot comparison and interaction checks for at least one real slug (baseline: `supergreat`).
- Dependency rule: no Elementor/WPBakery/Visual Portfolio lock-in for the new item-page rendering surface.

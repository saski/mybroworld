## Why

The owned `luciastuy` theme is intended to replace the current production `Glacier` presentation, but the current owned theme still misses key live identity elements: the embedded YouTube hero video, overlaid Lucia Astuy logo, production typography rhythm, footer, and the live site's intentionally sparse visible headings. Capturing this as a separate OpenSpec change keeps the visual identity work explicit, reviewable, and smaller than the broader shop roadmap.

## What Changes

- Add a focused visual-identity adjustment workstream for the owned `luciastuy` theme.
- Define requirements for a production-like home hero using the provided YouTube video reference: `youtube.com/watch?v=E4_s9_Ky91E`.
- Require the production logo asset to be represented over the hero video using `https://www.luciastuy.com/wp-content/uploads/2023/09/logo_oldschool_transp.png` or a locally versioned equivalent.
- Align typography decisions against the live site before implementation, including navigation, product/gallery labels, visible headings, and footer text.
- Require font parity with the original live theme on the affected public identity surfaces unless a specific exception is accepted.
- Require user-interaction parity with the original live theme for header navigation, hero/video behavior, gallery/product entry points, cart affordance, and responsive/mobile behavior.
- Define footer visual parity for the current live footer content pattern, spacing, typography, Instagram link, and `Lucia Astuy` copyright line.
- Decide which currently visible owned-theme headings should be hidden, restyled, or preserved so the replacement does not expose scaffold-like headings such as `Portfolio - Classic`.
- Record which Glacier-era plugins, bundled extensions, and builder dependencies become deletion candidates after the `luciastuy` migration is accepted.
- Keep implementation within owned WordPress theme code and avoid Elementor, WPBakery, paid/freemium visual plugins, or broad new dependencies.
- No production theme switch is included in this change.

## Capabilities

### New Capabilities

- `luciastuy-live-identity`: Requirements for aligning the owned `luciastuy` theme with the current live Lucia Astuy visual identity across the home hero, logo, typography, footer, and visible heading treatment.

### Modified Capabilities

- None. This repository does not yet contain archived OpenSpec specs for the shop identity surface.

## Impact

- Affected code: `wordpress/wp-content/themes/luciastuy/`.
- Affected validation: storefront visual baseline scripts, interaction baseline scripts, and owned WordPress code checks.
- Affected docs/plans: this change should remain linked to `openspec/changes/plan-catalog-commerce-roadmap/` section `6. Ecommerce Visual Identity` rather than mutating that roadmap while it is already in progress.
- Dependency constraints: no new paid/freemium visual plugin; prefer CSS, WordPress core APIs, WooCommerce hooks, and minimal owned templates.
- Customer decision points: video treatment, logo asset/source, font parity, interaction parity, visible-heading policy, footer parity, and post-migration plugin deletion candidates must be reviewed before the production switch.

# 2026-05-15 Identity Baseline And Decisions

## Scope

OpenSpec change: `align-luciastuy-live-identity`

This note records the baseline evidence and decisions for tasks `1.1` through `1.8`.

## Screenshot Baseline Evidence

### 1.1 Production home screenshots

- `wordpress/.tmp/visual-baseline/2026-05-15-glacier-production-home-identity/glacier-production-home-identity-desktop-home.png`
- `wordpress/.tmp/visual-baseline/2026-05-15-glacier-production-home-identity/glacier-production-home-identity-mobile-home.png`
- Manifest: `wordpress/.tmp/visual-baseline/2026-05-15-glacier-production-home-identity/manifest.json`

### 1.2 Local home screenshots

- `wordpress/.tmp/visual-baseline/2026-05-15-luciastuy-local-home-identity/luciastuy-local-home-identity-desktop-home.png`
- `wordpress/.tmp/visual-baseline/2026-05-15-luciastuy-local-home-identity/luciastuy-local-home-identity-mobile-home.png`
- Manifest: `wordpress/.tmp/visual-baseline/2026-05-15-luciastuy-local-home-identity/manifest.json`

## DOM/Style Snapshot Evidence

### 1.3 Live vs local interaction/style snapshots

- Production interaction report:
  `wordpress/.tmp/interaction-baseline/2026-05-15-glacier-production-identity/interaction-report.json`
- Local interaction report:
  `wordpress/.tmp/interaction-baseline/2026-05-15-luciastuy-local-identity/interaction-report.json`
- Production raw HTML snapshot (certificate bypass used because production certificate is expired at capture time):
  `wordpress/.tmp/identity-baseline/2026-05-15/glacier-home.html`

Key production home selectors found:

- Hero video reference: `data-jarallax-video="https://www.youtube.com/watch?v=E4_s9_Ky91E"`
- Logo over hero: `wp-content/uploads/2023/09/logo_oldschool_transp.png`
- Footer link: `https://www.instagram.com/luciastuy/`
- Footer container: `<footer class="footer">`

### 1.4 Original-theme font baseline

Production evidence indicates the primary families are:

- Display/navigation/headings: `Dosis`
- Body copy: `Source Sans Pro`

Captured sources:

- Inline Kirki style block in `glacier-home.html` (`#glacier_menu`, `body`, heading rules)
- In-page `@font-face` declarations referencing:
  - `https://www.luciastuy.com/wp-content/fonts/dosis/*.woff2`
  - `https://www.luciastuy.com/wp-content/fonts/source-sans-pro/*.woff2`

Production navigation computed style snapshot from interaction report:

- `fontFamily: Dosis`
- `fontSize: 12px`
- `letterSpacing: 2px`
- `textTransform: uppercase`

Local navigation computed style snapshot before implementation:

- `fontFamily: "Helvetica Neue", Helvetica, Arial, sans-serif`
- `fontSize: 11.52px`
- `letterSpacing: 2.7648px`
- `textTransform: uppercase`

### 1.5 Original-theme interaction baseline

Production interaction summary (non-mutating baseline):

- Navigation links visible (`INTRO`, `Catálogo`, `Contacto`)
- Mobile menu toggle detected (`toggleCount=1`)
- Shop/product/cart/checkout paths navigable
- Hero video and footer instagram link detected in `homeIdentity`

Local interaction summary before implementation:

- Navigation/logo/cart are functional
- Home identity assertions currently fail:
  - `missing_home_video_identity`
  - `missing_footer_instagram_link`

## Decisions

### 1.6 Logo source and fallback strategy

Decision: use **both** sources.

- Primary: owned local theme logo (`wordpress/wp-content/themes/luciastuy/assets/logo-lucia-astuy.png`)
- Fallback: production media URL (`https://www.luciastuy.com/wp-content/uploads/2023/09/logo_oldschool_transp.png`)
- Final fallback: site title text

Reason: keeps owned-code first while preserving visual continuity if local asset is missing.

### 1.7 Video embed and autoplay behavior

Decision: use `youtube.com` embed for parity and treat autoplay as progressive enhancement.

- Embed source: `https://www.youtube.com/embed/E4_s9_Ky91E`
- Default parameters include muted autoplay and loop where allowed
- If autoplay is blocked, controls and page navigation must remain usable

Reason: this is the closest behavior match to production while remaining resilient to browser autoplay policy differences.

### 1.8 Mandatory interactions vs allowed simplifications

Mandatory parity interactions:

- Header/logo/menu/cart entry behavior remains functional on desktop and mobile
- Home hero video presence and play controls/fallback behavior
- Footer instagram link presence and keyboard accessibility
- Shop/product/cart/checkout primary navigation and actions remain functional

Allowed simplifications:

- Internal builder-specific implementation details (Jarallax internals, old builder markup) are not copied
- Exact JavaScript event wiring is not required if user-facing behavior is equivalent

## Capture Constraints

At capture time, `https://www.luciastuy.com` had an expired TLS certificate. Baseline scripts were run with an explicit opt-in `--ignore-https-errors` mode to complete evidence collection without changing production.

## Post-Implementation Verification And Deltas

### Validation runs

- `scripts/wp-test-owned-code.sh` passed after implementation.
- Local visual baseline post-change:
  `wordpress/.tmp/visual-baseline/2026-05-15-luciastuy-local-identity-post/manifest.json`
- Local interaction baseline post-change (with `--allow-cart-mutation --require-payment-method --require-home-identity`) passed:
  `wordpress/.tmp/interaction-baseline/2026-05-15-luciastuy-local-identity-post/interaction-report.json`

### Before/after identity deltas (production Glacier vs local luciastuy post-change)

- Hero video identity:
  - Production `heroVideoCount=2`
  - Local post-change `heroVideoCount=2`
- Footer instagram link:
  - Production `footerInstagramLinkCount=1`
  - Local post-change `footerInstagramLinkCount=1`
- Footer identity text:
  - Production `footerIdentityTextCount=1`
  - Local post-change `footerIdentityTextCount=1`
- Navigation font family:
  - Production `Dosis`
  - Local post-change `Dosis, "Helvetica Neue", Helvetica, Arial, sans-serif`
- Navigation mobile toggle behavior:
  - Production baseline report shows `toggleCount=1` and `opensOnToggle=false`
  - Local post-change shows `toggleCount=1` and `opensOnToggle=true`

### Remaining notable differences

- Production baseline still reports legacy-pattern failures (`missing_header_logo_image`, mobile-menu-open mismatch, and some shop/checkout typography selectors) because the production structure is still Glacier/builder-based and does not fully align with the newer owned-theme assertion selectors.
- Local post-change interaction baseline reports `failures=0`, including home identity and payment-method checks.
- Production still serves Glacier assets and plugin/runtime coupling; migration cleanup remains candidate-only until a production switch and one-plugin-at-a-time validation.

## Iteration 2 Delta Inventory (from latest visual review)

The following additional deltas were identified and mapped into section `8` of `tasks.md`:

- Logo still shows a non-parity presentation; target must be transparent-background `logo_oldschool_transp.png` (or pixel-equivalent local transparent copy).
- Header menu typography still differs from original (family/weight/spacing/casing details, including accented `Catálogo` rendering).
- Footer differs from original minimal pattern (missing red heart accent, copy pattern differences, spacing rhythm differences).
- Hover overlay title typography on portfolio/product tiles differs in size/weight/placement.
- Button parity gaps remain (`Load More` and commerce actions).
- Additional visual deltas beyond initial report:
  - Header cart icon and counter badge shape/offset/weight mismatch.
  - Hero playback control visual prominence and center alignment mismatch.
  - Grid rhythm mismatch (gutter/overlay darkness and spacing after hero).
  - Footer separator and vertical spacing cadence mismatch.
  - Mobile-specific crop/spacing rhythm mismatches in hero/header/load-more area.

## Iteration 2 Implementation Outcomes

### Theme updates applied

- Header/logo:
  - Switched to a local pixel-equivalent copy of the production transparent logo asset: `wordpress/wp-content/themes/luciastuy/assets/logo_oldschool_transp.png`.
  - Updated logo sizing and header/cart spacing for closer parity.
- Navigation typography:
  - Enforced `Dosis` menu style parity (`12px`, `2px` letter spacing, uppercase rhythm) and active-link underline behavior.
- Footer parity:
  - Updated footer identity line to `Lucia Astuy ❤ 2024` with explicit red heart accent.
  - Tuned divider and spacing cadence to match live minimal footer behavior.
- Hover labels and buttons:
  - Added Visual Portfolio overlay/title typography parity styles.
  - Matched load-more button and WooCommerce action button style to black-fill original pattern.
- Cart icon parity:
  - Updated cart icon stroke geometry and badge size/offset/typography.
- Responsive behavior:
  - Added local hero poster fallback (`assets/home-hero-poster.jpg`) and mobile hero height tuning to preserve identity when iframe/video loading is delayed on small screens.

### Fresh evidence captured

- Full local storefront baseline after iteration-2 styling:
  - `wordpress/.tmp/visual-baseline/2026-05-15-luciastuy-local-identity-iteration2b/manifest.json`
  - `wordpress/.tmp/interaction-baseline/2026-05-15-luciastuy-local-identity-iteration2b/interaction-report.json`
- Focused home responsive recapture after mobile hero fallback tuning:
  - `wordpress/.tmp/visual-baseline/2026-05-15-luciastuy-local-identity-iteration2d-home/manifest.json`
  - `wordpress/.tmp/interaction-baseline/2026-05-15-luciastuy-local-identity-iteration2d/interaction-report.json`

### Accepted vs unresolved deltas

- Accepted:
  - Local owned theme now uses transparent logo asset parity, menu typography parity, footer heart/copy parity, cart badge/icon parity, and black button parity.
  - Interaction parity validation remains green (`failures=0`) after iteration-2 and mobile fallback tuning.
- Unresolved/known constraints:
  - Cookie-consent banner still overlays gallery captures during automated screenshots and can visually obscure tile overlays in evidence images.
  - Exact YouTube control chrome remains platform-dependent (iframe-rendered) and cannot be fully CSS-controlled; parity is implemented at placement/layout level with resilient fallback identity.

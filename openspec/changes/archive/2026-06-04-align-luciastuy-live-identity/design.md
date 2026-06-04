## Context

The owned `luciastuy` theme is the intended replacement for the current production `Glacier` presentation. Existing local work already covers a graphic logo, primary navigation, cart affordance, WooCommerce gallery support, shop/product typography, cart/checkout styling, and local checkout readiness. The remaining gap described by the user is narrower: the owned theme must feel like the live Lucia Astuy site on the public home and identity surfaces before it can replace `Glacier`.

Observed live-site identity elements to preserve or intentionally adapt:

- A large home hero video based on YouTube video `E4_s9_Ky91E`.
- A Lucia Astuy graphic logo overlaid on the hero, with the production asset URL `https://www.luciastuy.com/wp-content/uploads/2023/09/logo_oldschool_transp.png` as the reference.
- The same font family, sizing, spacing, uppercase rhythm, and interaction feel as the original live theme on affected public identity surfaces.
- Sparse, uppercase navigation with strong letter spacing and production-like hover/focus/click behavior.
- Minimal visible heading treatment on the home/gallery surface; scaffold-like page headings must not dominate the page.
- Footer pattern with matching layout, typography, spacing, Instagram link, and compact Lucia Astuy copyright line.
- A future cleanup note for Glacier-era plugins, bundled extensions, and builder dependencies that are no longer needed after the owned theme migration.

Constraints:

- Keep the work inside owned code under `wordpress/wp-content/themes/luciastuy/` unless a WordPress setting is the smaller reversible option.
- Avoid Elementor, WPBakery, paid/freemium visual plugins, gallery plugins, and broad visual dependencies.
- Keep the WooCommerce product, cart, checkout, and buyer-data behavior intact.
- Do not delete or deactivate production plugins as part of this identity change; only record post-migration deletion candidates and evidence.
- Use repeatable screenshots/interactions to compare production and local output.

## Goals / Non-Goals

**Goals:**

- Explore and document the live identity contract before implementation.
- Adjust the owned theme so the home identity can plausibly replace the production `Glacier` home presentation.
- Match the original live theme fonts, interaction behavior, and footer presentation on the affected public surfaces.
- Preserve WooCommerce shop/cart/checkout behavior already validated by the existing roadmap.
- Add validation that protects the video hero, logo overlay, typography, footer, and heading policy from regressions.
- Produce a plugin/extension cleanup note that can feed the existing one-plugin-at-a-time removal process after migration.

**Non-Goals:**

- Switch production to the `luciastuy` theme.
- Rebuild the current production page-builder stack.
- Introduce paid/freemium visual dependencies.
- Rework product inventory, checkout payment configuration, shipping, fulfillment, or GA4 observability.
- Delete, deactivate, or classify production plugins as safe to remove without a separate verification loop.
- Clone every production implementation detail if a lean owned-code equivalent gives the same customer-facing identity.

## Decisions

### Decision: Treat the live site as a visual reference, not as a dependency source

Use the live site and provided assets as reference evidence, then implement the replacement in the owned theme. The implementation may version a local logo asset if licensing/source ownership is clear, and it may use a lean iframe embed for the YouTube hero.

Alternatives considered:

- Reuse builder/page HTML from production. Rejected because it would preserve the commercial/builder coupling this project is trying to reduce.
- Add a new hero/gallery plugin. Rejected because it violates the lean owned-code dependency rule.

### Decision: Use a theme-controlled home hero component

The first implementation target should be a theme-controlled home hero that appears on the front page only, before the gallery/shop content. It should support the YouTube reference video, overlay treatment, logo placement, and responsive cropping through CSS.

Alternatives considered:

- Store the hero entirely in WordPress page content. Lower code churn, but harder to regression-test and easier to break accidentally.
- Build a generic block system. Rejected as too broad for this slice.

### Decision: Measure typography before changing it

The typography task should begin with a short baseline capture: navigation font family, size, letter spacing, heading visibility, footer text scale, and product/gallery title rhythm on the live site versus local theme. The default target is exact original-theme font parity for affected identity surfaces; exceptions must be named and accepted before implementation.

Alternatives considered:

- Make visual guesses from screenshots only. Rejected because typography changes are cheap to measure and easy to overfit.
- Use an approximate modern font stack. Rejected because the user explicitly wants the same fonts as the original theme.

### Decision: Treat interaction parity as a first-class requirement

The owned theme should mimic the original live theme's public interaction behavior for navigation, hero/video behavior, logo/home link, gallery/product entry points, cart affordance, responsive/mobile navigation, hover/focus states, and footer links. The interaction baseline should record expected behavior before implementation and verify it after changes.

Alternatives considered:

- Only match static screenshots. Rejected because the user called out replacement parity, and a visually similar theme that feels different can still fail review.
- Copy builder-generated JavaScript. Rejected because it would preserve the coupling this migration is intended to remove.

### Decision: Keep heading treatment intentional

The owned theme should not expose default page titles or scaffold labels on the home/gallery surface unless they are part of the approved visual identity. Headings required for accessibility can remain in the document structure while using visually hidden or restrained presentation when appropriate.

Alternatives considered:

- Hide every `h1`/`h2` visually. Rejected because product, cart, checkout, and accessibility contexts still need meaningful headings.

### Decision: Record plugin and extension deletion candidates after migration evidence exists

The identity change should add a migration-cleanup note that identifies Glacier-era dependencies likely made removable by the owned theme, but it should not delete or deactivate them. Candidate notes should feed the existing plugin inventory and removal log, where each plugin still follows backup, baseline, one-at-a-time deactivation, smoke validation, and rollback rules.

Initial evidence sources include `thoughts/shared/docs/woocommerce-audit.md`, `thoughts/shared/docs/wordpress-plugin-inventory.md`, `thoughts/shared/docs/wordpress-plugin-removal-log.md`, and the active `woocommerce-plugin-safety` spec under `openspec/changes/plan-catalog-commerce-roadmap/`.

Alternatives considered:

- Delete all Glacier/builder-related plugins immediately after theme migration. Rejected because visual replacement is not proof that no admin, content, shortcode, SEO, analytics, or historical content dependency remains.
- Ignore cleanup until after launch. Rejected because migration acceptance is the right moment to capture what dependencies became suspicious or unnecessary.

## Risks / Trade-offs

- External YouTube embed can affect privacy, cookies, and performance -> Prefer the smallest embed, consider `youtube-nocookie.com`, lazy loading, reduced controls, and a static fallback/poster if the embed fails.
- Autoplay policies differ by browser -> Treat muted autoplay as progressive enhancement and verify that the page remains acceptable when autoplay is blocked.
- Logo asset may not be locally versioned yet -> Confirm source ownership, then either version the asset in the theme or reference the WordPress media asset through a setting with a fallback.
- Overfitting to one desktop screenshot can hurt mobile -> Capture desktop and mobile baselines before and after changes.
- Hiding headings can reduce accessibility if done incorrectly -> Preserve semantic headings and only change their visual presentation where the visual identity requires it.
- Touching global typography can regress shop/cart/checkout -> Scope CSS selectors and rerun the existing interaction baseline after identity changes.
- Font files may be loaded by the original theme or a bundled extension -> Capture the source and decide whether a legally usable local font asset, system fallback, or explicit exception is needed.
- Interaction parity can accidentally copy builder coupling -> Match observed behavior, not builder markup or script internals.
- Plugin cleanup can become unsafe if inferred from theme migration alone -> Record candidates and evidence only; removal still requires the existing staged cleanup process.

## Migration Plan

1. Capture current production and local screenshots for `/` on desktop and mobile, plus a typography/footer/heading DOM snapshot.
2. Implement the smallest local theme change for the home hero and logo overlay.
3. Adjust fonts, footer, interaction states, and heading presentation in narrow CSS/template slices.
4. Run owned-code checks and targeted visual/interaction baselines.
5. Record post-migration Glacier-era plugin and extension deletion candidates in the existing plugin inventory/removal-log flow without deleting anything.
6. Keep rollback simple: revert the theme files or disable the hero component before production theme activation.

## Open Questions

- Should the production logo asset be downloaded and versioned in the theme, or referenced through WordPress media settings?
- Should the video embed use `youtube.com` exactly as production does, or `youtube-nocookie.com` for a more privacy-conscious owned implementation?
- Should the home hero autoplay silently, show explicit controls, or both depending on browser support?
- Which headings are customer-approved visible identity elements, and which are scaffold headings that should be visually hidden or removed from the home surface?
- Should the footer year remain fixed to the live-site value or become dynamic from the current year?
- Which exact original-theme font files or font stacks are approved for local owned-theme use?
- Which original-theme interactions are mandatory for acceptance versus acceptable simplifications?
- Which Glacier-era plugins/extensions should be listed as post-migration candidates: Elementor, Slider Revolution, WPBakery/js_composer, Visual Portfolio, ACF Pro bundles, Glacier theme helpers, or only currently active production plugins?

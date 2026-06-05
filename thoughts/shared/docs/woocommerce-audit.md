# WooCommerce Production Audit

## Objective
Capture the minimum production facts needed to bring the WooCommerce site into this repository without guessing.

## Access Inventory
- WordPress admin URL: `https://www.luciastuy.com/wp-admin`
- WordPress admin access confirmed: yes; production admin and WooCommerce status were re-captured on 2026-04-30
- DonDominio panel access confirmed: yes
- FTP access confirmed: yes
- SFTP access confirmed: not verified from current hosting evidence
- SSH access confirmed: not verified from current hosting evidence
- phpMyAdmin access confirmed: yes
- WP-CLI available: not confirmed from current evidence; treat as unavailable for automation until shell access is verified

## Runtime Inventory
- Production domain: `https://www.luciastuy.com`
- Public front page status: HTTP 200 on 2026-04-30 and 2026-06-05
- Public shop page status: HTTP 200 on 2026-04-30 and 2026-06-05
- Public cart page status: HTTP 200 on 2026-06-05
- Public checkout page status: HTTP 200 on 2026-06-05
- WordPress admin status: login/admin page opens on 2026-04-30
- PHP version: `8.4.18` from WooCommerce system status on 2026-04-30; earlier staged SQL export evidence noted `8.2.12`
- WordPress version: `6.9.4`
- WooCommerce version: `10.7.0` from WooCommerce system status on 2026-04-30
- Database engine/version: `MariaDB 11.8.3` from WooCommerce system status on 2026-04-30
- Caching layer in use: no dedicated WordPress cache plugin detected in the active plugin list; live response headers only show Apache and standard admin no-cache headers, so any server-side cache remains unconfirmed

## Theme Inventory
- Active theme: `Glacier`
- Parent theme: none; `Glacier` is the active standalone theme
- Theme source: commercial Mountain-Themes theme distributed for Envato/ThemeForest
- Child theme in use: no; both `template` and `stylesheet` are `glacier`
- Builder dependency detected: yes
- Theme maintainability assessment: High maintenance risk. The active theme has outdated WooCommerce template overrides and the site uses Elementor and Slider Revolution, which increases coupling and makes lean evolution harder.

## Plugin Inventory
List active plugins and classify them:

| Plugin | Version | Type | Keep | Notes |
|---|---|---|---|---|
| Advanced Custom Fields PRO | 6.2.0 | builder/data modeling | maybe | Bundled/pro dependency; license activation is required for automatic updates |
| Akismet Anti-spam: Spam Protection | 5.7 | infrastructure | maybe | Active in the 2026-04-30 production admin snapshot |
| All-in-One WP Migration | 7.81 | infrastructure | maybe | Useful for export/import, not part of runtime architecture; direct export page was not accessible in the 2026-04-30 admin session |
| Contact Form 7 | 6.1.5 | content/editorial | maybe | Keep only if forms are still in use |
| Duplicate Page | 4.5.7 | editorial utility | maybe | No durable runtime need identified yet |
| Elementor | 4.0.5 | builder | no | Indicates page-builder coupling |
| Envato Market | 2.0.13 | infrastructure/theme updater | maybe | Tied to commercial theme/plugin update workflow |
| Hello Dolly | 1.7.2 | nonessential | no | Active and not needed for runtime |
| Kirki Customizer Framework | 5.2.2 | theme dependency | maybe | Tied to Glacier customizer/theme behavior |
| One Click Demo Import | 3.4.1 | demo/import utility | no | Active demo importer; usually not needed in production runtime |
| Site Kit by Google | 1.177.0 | infrastructure | maybe | Keep only if analytics/Search Console integration is needed |
| Slider Revolution | 6.6.15 | builder | no | Adds another visual layer with maintenance cost |
| Visual Portfolio, Posts & Image Gallery | 3.6.0 | portfolio/gallery | maybe | Active and tied to current portfolio content/menu |
| WooCommerce | 10.7.0 | required | yes | Required commerce runtime |
| WordPress Importer | 0.9.5 | import utility | no | Active importer; usually not needed in production runtime |
| WPBakery Page Builder | 7.0 | builder | no | Heavy legacy shortcode/theme coupling |
| Yoast SEO | 27.5 | infrastructure | maybe | Reasonable to keep if already configured |

Types:
- required
- infrastructure
- content/editorial
- builder
- unclassified third-party

## Custom Code Inventory
- Custom theme path on server: `/public/wp-content/themes/glacier`
- Custom plugin paths on server: no custom plugin directories identified yet; production plugins are third-party
- `mu-plugins` path on server: no production `mu-plugins` footprint has been confirmed from the SQL export or pulled code snapshot
- Theme snippets currently living in `functions.php`: not inventoried yet; treat existing theme logic as legacy migration source until extracted intentionally
- WooCommerce template overrides present: yes

## Content And Data Inventory
- DB export created: yes
- DB export location: `/Users/nacho/Downloads/ddb209390.sql` and staged to `wordpress/wordpress.sql`
- Uploads size estimate: not measured yet
- Upload sync needed for current work: only for targeted migration or visual QA sessions that need real media
- Critical product/artwork custom fields discovered: pending deeper DB inspection
- Production catalog inventory baseline from 2026-05-01 research: the public Store API exposed 15 legacy/demo products with zero images, while the canonical sheet/CSV contained 20 `LA-2026-*` artwork rows with populated image sources.
- Local sync validation on 2026-05-01 created 20 managed `LA-2026-*` WooCommerce products with images, then hid 15 unmanaged legacy/demo products from the local Store API.
- Production sync dry-run on 2026-05-01 used backup identifier `production-db-export-20260501-195148` and saved its plan to `backups/production-db-export-20260501-195148/production-woo-sync-dry-run.json`.
- Production sync dry-run result: `create=20 update=0 needs_image=0 unchanged=0 invalid_source=0 unexpected_unmanaged=15`; plan review found zero validation errors and zero non-canonical writes.
- Production managed-product sync was applied on 2026-05-01 after deploying the owned Drive image sideload MU helper. The apply used an ephemeral read/write WooCommerce key that was revoked after the run.
- Production apply result: `create=20 update=0 needs_image=0 unchanged=0 invalid_source=0 unexpected_unmanaged=15`; public Store API assertion returned `products=35 expected=20 missing=0 missing_images=0 unexpected=15`.
- Production post-apply dry-run result: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`.
- Production unmanaged cleanup was applied on 2026-05-01 after backup identifier `production-db-export-20260501-203207`. The cleanup used an ephemeral read/write WooCommerce key that was revoked after the run.
- Production cleanup result: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`; public Store API assertion returned `products=20 expected=20 missing=0 missing_images=0 unexpected=0`.
- Production post-cleanup dry-run result: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`.
- Production sync status: managed canonical products are applied with images, and unmanaged legacy/demo products are hidden from the public Store API.
- Production Store API assertion on 2026-06-05 returned `products=20 expected=20 missing=0 missing_images=0 unexpected=0` against `catalog-generator/data/CATALOGO_BASE.csv`.
- Production public smoke on 2026-06-05 returned HTTP 200 for `/`, `/shop/`, `/cart/`, `/checkout/`, and `/product/fanzimad-2026-yuju/`.
- Production anonymous browser checkout probe on 2026-06-05 found shop/product availability signals (`productLinkCount=24`, `shop addToCartActionCount=3`, product image visible, product add-to-cart actions present), but the cart stayed empty after the add-to-cart attempt and checkout did not expose buyer fields or payment methods. Treat production checkout/payment as blocked until the add-to-cart/cart persistence issue is diagnosed.

## Decision Gate

### Keep Current Theme Via Child Theme
Choose this if all are true:
- no heavy builder lock-in
- templates are understandable
- styling debt is bounded
- WooCommerce overrides are limited

### Replace Incrementally With Custom Theme
Choose this if any are true:
- builder-heavy theme
- paid theme dependency with poor maintainability
- dense or brittle overrides
- many business rules embedded in theme files

## Evidence Checklist
- Screenshot or note of active theme
- Screenshot or note of active plugin list
- Exported DB snapshot
- Pulled copy of owned theme/plugin code

## Evidence Captured So Far
- Active theme page confirms `Glacier` is active.
- Plugins page confirms 17 active plugins with versions on 2026-04-30.
- Admin payload confirms WordPress version `6.9.4`.
- WooCommerce status confirms WooCommerce `10.7.0`, PHP `8.4.18`, MariaDB `11.8.3`, and active theme `Glacier` `5.0.1`.
- WooCommerce admin warns that the active theme contains outdated WooCommerce template overrides.
- Public front page and shop returned HTTP 200 on 2026-04-30.
- Production DB export for WooCommerce sync guardrail: `backups/production-db-export-20260501-195148/wordpress-db.sql`, sha256 `cfb23ca6901da64c784ad63fdc779649a345a3464e252b0d2dd1e198a7864ebb`.
- Production DB export before unmanaged cleanup: `backups/production-db-export-20260501-203207/wordpress-db.sql`, sha256 `8f7755d7ed7af56b0b85ef33006396054f77267e96118227738bfe31f0e3d2bf`.

## Hosting Facts Confirmed

- FTP server: `ftp.luciastuy.com`
- Hosting document root for WordPress: `/public` under `/var/www/luciastuy.com/`
- Production database: `ddb209390`
- WordPress table prefix: `wp_nueva`
- Theme version from `style.css`: `5.0.1`
- Theme bundles ACF Pro, Slider Revolution, WPBakery (`js_composer`), and WooCommerce support through TGM/plugin coupling

## WooCommerce Theme Warnings

Captured from WooCommerce system status on 2026-04-30:

- Active theme: `Glacier` `5.0.1`
- Child theme: no; WooCommerce recommends using a child theme when modifying a parent theme not personally built by the operator.
- Theme type: classic theme
- Archive template warning: `woocommerce.php` takes priority over `woocommerce/archive-product.php`, so archive-product overrides will not apply.
- Outdated overrides:
  - `wp-content/themes/glacier/woocommerce/content-product.php`: version `3.6.0`, core version `9.4.0`
  - `wp-content/themes/glacier/woocommerce/global/quantity-input.php`: version `7.4.0`, core version `10.1.0`
  - `wp-content/themes/glacier/woocommerce/loop/pagination.php`: version `3.6.0`, core version `9.3.0`
- Additional overrides present:
  - `wp-content/themes/glacier/woocommerce/loop/loop-end.php`
  - `wp-content/themes/glacier/woocommerce/loop/loop-start.php`
  - `wp-content/themes/glacier/woocommerce/content-product_cat.php`

## Architecture Decision

`Glacier` is builder-heavy, bundles third-party plugin coupling, and carries outdated WooCommerce overrides. The repo will treat it as migration source material for the audit and intentional template extraction only; it is not repo-owned runtime code and should not remain part of the maintained owned-code-only surface.

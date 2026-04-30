# WooCommerce Production Audit

**Last refreshed:** 2026-04-30 21:17 CEST

## Objective
Capture the minimum production facts needed to bring the WooCommerce site into this repository without guessing.

## Access Inventory
- WordPress admin URL: `https://www.luciastuy.com/wp-admin`
- WordPress admin access confirmed: yes; logged in and re-captured plugin/theme/WooCommerce status on 2026-04-30
- DonDominio panel access confirmed: yes
- FTP access confirmed: yes
- SFTP access confirmed: not verified from current hosting evidence
- SSH access confirmed: not verified from current hosting evidence
- phpMyAdmin access confirmed: yes
- WP-CLI available: not confirmed from current evidence; treat as unavailable for automation until shell access is verified

## Runtime Inventory
- Production domain: `https://www.luciastuy.com`
- Public front page status: HTTP 200 on 2026-04-30
- Public shop page status: HTTP 200 on 2026-04-30
- WordPress admin status: login/admin page opens on 2026-04-30
- PHP version: `8.4.18` from WooCommerce system status on 2026-04-30
- WordPress version: `6.9.4`
- WooCommerce version: `10.7.0`
- Database engine/version: `MariaDB 11.8.3`
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
| Advanced Custom Fields PRO | 6.2.0 | builder/data modeling | maybe | Bundled/pro dependency; update available to 6.8.0.1 but license activation is required for automatic updates |
| Akismet Anti-spam: Spam Protection | 5.7 | infrastructure | maybe | Active but setup notice is visible |
| All-in-One WP Migration | 7.81 | infrastructure | maybe | Useful for export/import, not part of runtime architecture; current admin session could not access direct export page |
| Contact Form 7 | 6.1.5 | content/editorial | maybe | Keep only if forms are still in use |
| Duplicate Page | 4.5.7 | editorial utility | maybe | Update available to 4.5.8 |
| Elementor | 4.0.5 | builder | no | Indicates page-builder coupling |
| Envato Market | 2.0.13 | infrastructure/theme updater | maybe | Tied to commercial theme/plugin update workflow |
| Hello Dolly | 1.7.2 | nonessential | no | Active and not needed for runtime |
| Kirki Customizer Framework | 5.2.2 | theme dependency | maybe | Update available to 6.0.2; TGM notice visible |
| One Click Demo Import | 3.4.1 | demo/import utility | no | Active demo importer; usually not needed in production runtime |
| Site Kit by Google | 1.177.0 | infrastructure | maybe | Keep only if analytics integration is needed |
| Slider Revolution | 6.6.15 | builder | no | Adds another visual layer with maintenance cost |
| Visual Portfolio, Posts & Image Gallery | 3.6.0 | portfolio/gallery | maybe | Active and tied to current portfolio content/menu |
| WooCommerce | 10.7.0 | required | yes | Required commerce runtime |
| WordPress Importer | 0.9.5 | import utility | no | Active importer; usually not needed in production runtime |
| WPBakery Page Builder | 7.0 | builder | no | Update available to 8.7.2 but license activation is required; theme/builder coupling |
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

## Hosting Facts Confirmed

- FTP server: `ftp.luciastuy.com`
- Hosting document root for WordPress: `/public` under `/var/www/luciastuy.com/`
- Production database: `ddb209390`
- WordPress table prefix: `wp_nueva`
- Theme version from `style.css`: `5.0.1`
- Theme bundles ACF Pro, Slider Revolution, WPBakery (`js_composer`), and WooCommerce support through TGM/plugin coupling

## Current WooCommerce Theme Warnings

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

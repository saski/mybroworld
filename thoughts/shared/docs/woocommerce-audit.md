# WooCommerce Production Audit

## Objective
Capture the minimum production facts needed to bring the WooCommerce site into this repository without guessing.

## Access Inventory
- WordPress admin URL: `https://www.luciastuy.com/wp-admin`
- WordPress admin access confirmed: yes
- DonDominio panel access confirmed: yes
- FTP access confirmed: yes
- SFTP access confirmed: not verified from current hosting evidence
- SSH access confirmed: not verified from current hosting evidence
- phpMyAdmin access confirmed: yes
- WP-CLI available: not confirmed from current evidence; treat as unavailable for automation until shell access is verified

## Runtime Inventory
- Production domain: `https://www.luciastuy.com`
- PHP version: `8.2.12` at the time of the staged SQL export
- WordPress version: `6.9.4`
- WooCommerce version: `10.6.2`
- Database engine/version: `MariaDB 11.8`
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
| WooCommerce |  | required | yes |  |
| Elementor |  | builder | no | Indicates page-builder coupling |
| Slider Revolution |  | builder | no | Adds another visual layer with maintenance cost |
| Yoast SEO |  | infrastructure | maybe | Reasonable to keep if already configured |
| Contact Form 7 |  | content/editorial | maybe | Keep only if forms are still in use |
| Site Kit by Google |  | infrastructure | maybe | Keep only if analytics integration is needed |
| All-in-One WP Migration |  | infrastructure | maybe | Useful for export/import, not part of runtime architecture |

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
- Plugins page confirms presence of `WooCommerce`, `Elementor`, `Slider Revolution`, `Yoast SEO`, `Contact Form 7`, `Site Kit by Google`, and `All-in-One WP Migration`.
- Admin payload confirms WordPress version `6.9.4`.
- WooCommerce admin warns that the active theme contains outdated WooCommerce template overrides.

## Hosting Facts Confirmed

- FTP server: `ftp.luciastuy.com`
- Hosting document root for WordPress: `/public` under `/var/www/luciastuy.com/`
- Production database: `ddb209390`
- WordPress table prefix: `wp_nueva`
- Theme version from `style.css`: `5.0.1`
- Theme bundles ACF Pro, Slider Revolution, WPBakery (`js_composer`), and WooCommerce support through TGM/plugin coupling

## Architecture Decision

`Glacier` is builder-heavy, bundles third-party plugin coupling, and carries outdated WooCommerce overrides. The repo will treat it as migration source material for the audit and intentional template extraction only; it is not repo-owned runtime code and should not remain part of the maintained owned-code-only surface.

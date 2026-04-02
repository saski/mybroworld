# WordPress Workspace

This directory contains the repo-managed WordPress custom layer for the Lucía Astuy WooCommerce site.

## Scope

Tracked in git:
- `wp-content/themes/luciastuy/`
- `wp-content/mu-plugins/`
- `wp-content/plugins/` only for custom plugins we own
- local runtime files and scripts

Not tracked in git:
- WordPress core
- third-party plugins
- third-party themes, including `Glacier`
- uploads
- database dumps with production data

## Strategy

This workspace is owned-code-only. The imported production `Glacier` theme is audit evidence and migration source material, not part of the long-term runtime surface. Local development and deployment should only manage code we intend to maintain:
- `wp-content/themes/luciastuy/`
- `wp-content/mu-plugins/`
- custom plugins we explicitly add later

Use [woocommerce-audit.md](../docs/woocommerce-audit.md) to keep the production findings and architecture decision current.

## Local Boot

1. Copy `.env.example` to `.env` and adjust ports or passwords if needed.
   The default table prefix is `wp_lucia_` to keep clean local installs separate from the production `wp_nueva` tables.
2. Start the disposable stack from the repository root:

```bash
docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml up -d
```

3. Open:
- WordPress: `http://localhost:8080`
- phpMyAdmin: `http://localhost:8081`

4. Install WordPress into the disposable local runtime:

```bash
docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml run --rm wpcli core install --url=http://localhost:8080 --title="Lucia Stuy Local" --admin_user=admin --admin_password=change-me-now --admin_email=studio@example.test --skip-email
```

5. Install and activate WooCommerce locally:

```bash
docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml run --rm wpcli plugin install woocommerce --activate
```

The local runtime is meant to boot cleanly without production content. Import the production database only when you are doing targeted migration or debugging work, not as part of the default bootstrap path.

## Importing Production Data

After you export a production DB dump:

```bash
scripts/wp-pull-db.sh /absolute/path/to/export.sql
```

This copies the dump into `wordpress/wordpress.sql` for manual import.

If you also need media for visual work, sync only the required subset of uploads.

## Verification

```bash
docker compose --env-file wordpress/.env.example -f wordpress/docker-compose.yml config
docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml up -d
docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml ps
docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml run --rm wpcli core version
```

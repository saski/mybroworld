# Lean Plan: Bring WooCommerce Into The Repo

## Overview
The goal is to work on the existing WooCommerce site from local development while keeping the setup lean, minimizing paid templates/plugins, and preserving the current PDF catalog pipeline.

The recommended approach is to version only the custom WordPress code and supporting tooling, not a full WordPress installation. DonDominio should be treated as managed shared hosting first: deploy code by FTP/SFTP, manage the database separately, and keep the remote media library out of git.

## Current State
- The repository currently contains only the PDF catalog generator in `catalog-generator/`.
- There is no WordPress or WooCommerce code tracked locally.
- Production is a WooCommerce site hosted at DonDominio.
- The PDF pipeline already has a stable editorial data contract based on normalized artwork fields.

## Desired End State
- This repository also contains the WooCommerce custom code needed to evolve the site locally.
- Local development can run the WooCommerce site with a production-like theme/plugin setup.
- Deployment to DonDominio is simple and low-risk.
- The WooCommerce site and the PDF generator can converge on a shared artwork model over time.

## Out Of Scope
- Replacing WooCommerce.
- Rebuilding the site with a paid theme or heavy page builder.
- Checking WordPress core into git.
- Fully automating infra beyond what shared hosting reasonably supports.

## Recommended Lean Strategy

### Decision 1: Version custom code only
Track these in git:
- `wordpress/wp-content/themes/luciastuy/` or `wordpress/wp-content/themes/luciastuy-child/`
- `wordpress/wp-content/mu-plugins/`
- `wordpress/wp-content/plugins/lucia-catalog-sync/` only if a custom plugin becomes necessary
- deployment scripts
- local environment files and docs

Do not track:
- WordPress core
- WooCommerce plugin source unless you fork it, which should be avoided
- uploads
- database dumps with sensitive data
- paid theme/plugin code if any are already installed remotely

### Decision 2: Prefer a custom block theme or a very thin child theme
Leanest path depends on the current production theme:
- If the current site already uses a stable free theme: create a child theme and keep changes there.
- If the current site is simple or will be reworked: create a custom theme with minimal templates and WooCommerce overrides.

Recommendation:
- Start by auditing the current production theme.
- If it is lightweight and acceptable, use a child theme.
- If it is page-builder-heavy or hard to maintain, replace it with a custom theme incrementally.

### Decision 3: Use as few plugins as possible
Keep plugin policy strict:
- Required: WooCommerce
- Maybe required: an SEO plugin, a caching plugin if hosting needs it
- Avoid: visual builders, catalog plugins, PDF plugins, sync plugins unless they remove meaningful maintenance burden
- Prefer custom code in `mu-plugins` for small business rules and data mapping

### Decision 4: Local dev should use a disposable WordPress runtime
For local development, use one of these:
- Best lean/dev balance: Docker Compose with `wordpress`, `mysql`, and optional `phpmyadmin`
- Simplest non-repo setup: LocalWP on each machine, with repo-mounted theme/plugin folders

Recommendation:
- Use Docker Compose in the repo because it is portable, reviewable, and does not add paid dependencies.

## Target Repository Shape

```text
catalog-generator/
wordpress/
  docker-compose.yml
  .env.example
  README.md
  wp-content/
    themes/
      luciastuy/              # or luciastuy-child/
    mu-plugins/
      lucia-bootstrap.php
      lucia-artwork-rules.php
    plugins/
      lucia-catalog-sync/     # only if needed
scripts/
  wp-pull-uploads.sh
  wp-pull-db.sh
  wp-push-theme.sh
thoughts/shared/plans/
```

## Phase Plan

## Phase 1: Production Audit
Objective: understand what exists on DonDominio before choosing child theme vs replacement.

Execution status:
- Complete. Production access was confirmed through WordPress admin, DonDominio, phpMyAdmin, and FTP.
- Audit worksheet created and populated at `docs/woocommerce-audit.md`.

Tasks:
- Record the active theme and parent theme.
- Record active plugins.
- Record PHP and WordPress versions.
- Confirm access methods: FTP, SFTP, SSH, phpMyAdmin, WP-CLI availability.
- Export a database snapshot.
- Pull the current `wp-content/themes` and any custom plugins.

Expected files:
- `wordpress/README.md`
- `docs/woocommerce-audit.md` or `thoughts/shared/findings` equivalent

Success criteria:
- We have an inventory of theme/plugins/access constraints.
- We know whether current production is maintainable as a child-theme setup.

## Phase 2: Bring Custom Code Into Git
Objective: put the minimum viable WordPress custom layer under version control.

Execution status:
- Partially complete. Repository workspace and target directories created. The production theme `glacier` has been pulled into `wordpress/wp-content/themes/glacier`, but custom plugin and mu-plugin inventory is still incomplete.

Tasks:
- Create `wordpress/` workspace in repo.
- Add `.gitignore` for WordPress runtime artifacts.
- Commit the active child theme or extracted custom theme.
- Commit any custom snippets currently living in theme `functions.php` into `mu-plugins` where appropriate.
- Remove server-only clutter from tracked code.

Expected files:
- `wordpress/.gitignore`
- `wordpress/wp-content/themes/...`
- `wordpress/wp-content/mu-plugins/...`

Success criteria:
- The repo contains only the code we actually own and intend to change.
- Theme behavior is reproducible locally after database import.

## Phase 3: Local Runtime
Objective: make local development routine and cheap.

Execution status:
- Partially complete. `wordpress/docker-compose.yml`, `wordpress/.env.example`, and `wordpress/README.md` were created.
- Runtime boot was not verified in this environment because Docker is unavailable.

Tasks:
- Add `docker-compose.yml` with WordPress + MySQL.
- Add `.env.example`.
- Document how to import DB and optionally sync uploads.
- Mount local theme/plugin directories into the container.

Expected files:
- `wordpress/docker-compose.yml`
- `wordpress/.env.example`
- `wordpress/README.md`

Success criteria:
- `docker compose up` boots a local site.
- The local site loads with the imported DB and custom code.

## Phase 4: Deployment Workflow For DonDominio
Objective: make production updates predictable without adding CI complexity too early.

Execution status:
- Partially complete. Initial deploy and data-staging scripts were created under `scripts/`.
- Remote deployment remains unverified until production access details are available.

Tasks:
- Add a script to deploy only theme and mu-plugin code by FTP/SFTP/rsync if supported.
- Document a manual DB migration policy.
- Separate content changes from code changes.

Recommendation:
- Start with manual deploy scripts plus checklist.
- Add CI later only if deployment frequency justifies it.

Expected files:
- `scripts/wp-push-theme.sh`
- `docs/deploy-wordpress.md` or `wordpress/README.md`

Success criteria:
- A code-only change can be deployed repeatably without touching WordPress core.

## Phase 5: Converge Catalog Data
Objective: align WooCommerce data with the existing PDF generator without forcing a premature platform rewrite.

Execution status:
- Not started. Only a placeholder `mu-plugin` with shared status-label logic exists.

Tasks:
- Define the canonical artwork fields once.
- Decide whether the first sync direction is `Sheet -> WooCommerce` or `WooCommerce -> normalized export`.
- Move artwork business rules to shared code or shared documented contract.

Expected files:
- `catalog-generator/src/normalize-artwork.*`
- `wordpress/wp-content/mu-plugins/lucia-artwork-rules.php` or custom plugin equivalent
- `docs/artwork-data-contract.md`

Success criteria:
- The same artwork status/price rules are applied consistently in web and PDF contexts.

## Strategy Tradeoffs

### Option A: Full WordPress repo
Pros:
- Easy mental model
- Everything appears local

Cons:
- Bloated git history
- Core/plugin update noise
- Harder to review
- Worse fit for shared hosting

Verdict: reject.

### Option B: Custom-code-only repo
Pros:
- Leanest setup
- Clean diffs
- Easy deployments
- Good for shared hosting

Cons:
- Requires one-time discipline around local bootstrap and DB sync

Verdict: choose this.

## Minimal Plugin Policy
Use plugins only when they satisfy one of these:
- Legally/commercially necessary
- Security or backup critical
- Save more maintenance than they introduce

Otherwise, prefer:
- theme templates
- WooCommerce hooks
- `mu-plugins`
- small custom admin utilities

## Leanest First Implementation Sequence
1. Audit production theme/plugins/access.
2. Pull current custom theme and custom plugin code into `wordpress/wp-content/`.
3. Add local Docker runtime.
4. Run the existing site locally using production DB clone.
5. Only then decide whether to keep the current theme, create a child theme, or replace it.

## Risks And Mitigations
- Risk: production uses a builder-heavy theme.
  - Mitigation: freeze it, then progressively replace templates in a custom theme.
- Risk: DonDominio provides only FTP and phpMyAdmin.
  - Mitigation: keep deployment script FTP-based and database workflow manual/export-driven.
- Risk: media library is large.
  - Mitigation: do not sync all uploads initially; sync only required subsets for active work.
- Risk: logic leaks into WordPress snippets.
  - Mitigation: move business rules into `mu-plugins` or one custom plugin.

## First Concrete Tasks
1. Capture production audit data.
2. Export current theme/custom plugin files from DonDominio.
3. Create `wordpress/` folder structure in this repo.
4. Add Docker Compose local runtime.
5. Commit only owned custom code.

## Verification Commands
These apply once implementation starts:
- `docker compose -f wordpress/docker-compose.yml up -d`
- `docker compose -f wordpress/docker-compose.yml logs --tail=100`
- `php -l wordpress/wp-content/mu-plugins/*.php`
- `find wordpress/wp-content/themes -name '*.php' -print0 | xargs -0 -n1 php -l`

## Final Recommendation
Choose a custom-code-only WordPress workspace inside this repo, backed by Docker for local execution and FTP/SFTP deployment to DonDominio. Avoid paid themes and heavy plugins. Keep WooCommerce, own the theme layer, and move business-specific behavior into small `mu-plugins`.

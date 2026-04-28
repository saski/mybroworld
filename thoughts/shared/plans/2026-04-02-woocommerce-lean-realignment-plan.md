# Lean Realignment Plan: WooCommerce Custom-Code Repo

## Overview
Realign the WooCommerce work to the original lean intent: this repository should manage only the WordPress code we own, plus the tooling needed to run and deploy that code safely. The current imported `glacier` production theme is useful as audit evidence, but it is not an acceptable long-term repo surface because it carries third-party builder coupling, demo payloads, and maintenance noise that contradict the original strategy.

This plan replaces the "pull production theme into git and work from there" drift with a stricter custom-code-only workflow: finish the audit, remove imported vendor theme payload from the repo, create an owned theme layer, make local development disposable and scriptable, and defer catalog/data convergence until the WordPress surface is stable.

## Current State
- The repo already contains a WordPress workspace under `wordpress/`, deployment scripts under `scripts/`, and an audit doc at `thoughts/shared/docs/woocommerce-audit.md`.
- Production audit evidence shows the active theme is `Glacier`, and the stack is builder-heavy (`Elementor`, `Slider Revolution`, WPBakery/`js_composer`, bundled ACF Pro, outdated WooCommerce overrides).
- The repo currently includes the imported production theme at `wordpress/wp-content/themes/glacier/`, including backup/demo artifacts and bundled assets that are not repo-owned custom code.
- The repo includes a disposable local runtime scaffold (`wordpress/docker-compose.yml`, `wordpress/.env.example`, `wordpress/README.md`), but it has not been verified end to end.
- The repo includes early `mu-plugins` under `wordpress/wp-content/mu-plugins/`, but the artwork data contract is still only a placeholder.

## Desired End State
- Git tracks only WordPress code we intend to own and maintain:
  - `wordpress/wp-content/themes/luciastuy/`
  - `wordpress/wp-content/mu-plugins/`
  - `wordpress/wp-content/plugins/` only if a custom plugin becomes necessary
  - local runtime files, scripts, and developer docs
- The imported `glacier` theme is no longer part of the tracked runtime surface.
- Local development boots a disposable WordPress + MySQL environment and mounts only repo-owned code.
- Production deployment uploads only repo-owned theme and `mu-plugin` code, without touching WordPress core, third-party plugins, or uploads.
- The WooCommerce site and PDF catalog share a documented artwork contract before any sync logic is introduced.

## Out Of Scope
- Replacing WooCommerce.
- Reproducing the exact production `Glacier` + builder stack inside git.
- Checking WordPress core, uploads, DB dumps, or paid plugin/theme code into git.
- Building a sync pipeline between WooCommerce and the PDF generator in the same pass as the repo realignment.
- Introducing CI/CD before the manual deployment workflow is stable.

## Approach

### Option A: Keep `glacier` in git as the compatibility baseline
Pros:
- Fastest route to approximate production locally.
- Low immediate refactor cost.

Cons:
- Keeps third-party builder/theme payload in repo.
- Conflicts with the original custom-code-only intent.
- Preserves outdated WooCommerce overrides and bundled plugin coupling.
- Makes future diffs and deployments noisy.

### Option B: Reset to an owned-code-only WordPress layer
Pros:
- Matches the original repo strategy.
- Produces cleaner diffs and safer deployment scope.
- Creates a maintainable path away from builder-heavy production debt.

Cons:
- Requires an explicit reset step and a minimal new theme baseline.
- Local parity with production will be functional, not pixel-identical, until templates are migrated intentionally.

Recommendation:
- Choose Option B.
- Treat the imported `glacier` code as temporary audit input, not as the maintained application surface.
- Build a thin owned theme at `wordpress/wp-content/themes/luciastuy/` and move business rules into `mu-plugins`.

## Target Repository Shape

```text
catalog-generator/
  src/
    generate.mjs
wordpress/
  docker-compose.yml
  .env.example
  README.md
  wp-content/
    themes/
      luciastuy/
    mu-plugins/
      lucia-bootstrap.php
      lucia-artwork-rules.php
scripts/
  wp-pull-db.sh
  wp-pull-uploads.sh
  wp-push-theme.sh
thoughts/shared/plans/
thoughts/shared/docs/
  woocommerce-audit.md
  deploy-wordpress.md
  artwork-data-contract.md
```

## Phase Plan

## Phase 1: Complete Audit And Lock The Architecture Decision
Objective: close the missing production facts and explicitly record that the repo will not track the imported `Glacier` theme as its maintained runtime surface.
Status: completed on 2026-04-02

Tasks:
- Finish the missing fields in `thoughts/shared/docs/woocommerce-audit.md`:
  - PHP version
  - exact WooCommerce version
  - child-theme status
  - parent theme status
  - caching layer
  - `mu-plugins` presence on production
  - whether WP-CLI is truly available
- Add a short decision section to `thoughts/shared/docs/woocommerce-audit.md` stating that `Glacier` is builder-heavy and will be treated as migration source material, not as repo-owned runtime code.
- Update `wordpress/README.md` so it describes the owned-code-only strategy rather than the current mixed state.

Expected file modifications:
- `thoughts/shared/docs/woocommerce-audit.md`
- `wordpress/README.md`

Automated success criteria:
- `rg -n "yes/no|unknown|^-$|PHP version:$|Caching layer in use:$|Parent theme:$|Child theme in use:$" thoughts/shared/docs/woocommerce-audit.md` returns no matches for unresolved placeholders.
- `rg -n "migration source material|owned-code-only|do not track Glacier" thoughts/shared/docs/woocommerce-audit.md wordpress/README.md`

## Phase 2: Reset The Repo To Owned Code Only
Objective: remove imported third-party theme payload from the maintained runtime surface and replace it with an owned theme skeleton.
Status: completed on 2026-04-02

Tasks:
- Remove `wordpress/wp-content/themes/glacier/` from the repo-managed runtime.
- Create `wordpress/wp-content/themes/luciastuy/` as the owned theme baseline.
- Add the minimum required theme files:
  - `wordpress/wp-content/themes/luciastuy/style.css`
  - `wordpress/wp-content/themes/luciastuy/functions.php`
  - `wordpress/wp-content/themes/luciastuy/index.php`
  - `wordpress/wp-content/themes/luciastuy/woocommerce.php`
- Keep repo-owned business logic in `wordpress/wp-content/mu-plugins/`; do not copy builder/plugin behavior into the new theme unless there is an explicit business need.
- Update `wordpress/.gitignore` if any runtime-generated directories need additional protection.

Expected file modifications:
- `wordpress/.gitignore`
- `wordpress/wp-content/themes/glacier/` removed
- `wordpress/wp-content/themes/luciastuy/style.css`
- `wordpress/wp-content/themes/luciastuy/functions.php`
- `wordpress/wp-content/themes/luciastuy/index.php`
- `wordpress/wp-content/themes/luciastuy/woocommerce.php`
- `wordpress/wp-content/mu-plugins/lucia-bootstrap.php`
- `wordpress/wp-content/mu-plugins/lucia-artwork-rules.php`

Automated success criteria:
- `test ! -d wordpress/wp-content/themes/glacier`
- `test -f wordpress/wp-content/themes/luciastuy/style.css`
- `test -f wordpress/wp-content/themes/luciastuy/functions.php`
- `rg -n "js_composer|revslider|elementor|visual-portfolio|acf_pro" wordpress/wp-content/themes/luciastuy wordpress/wp-content/mu-plugins` returns no matches.
- `find wordpress/wp-content/themes -maxdepth 1 -mindepth 1 -type d | sort` shows only the owned theme directories intended for git.

## Phase 3: Make Local Runtime Disposable And Verifiable
Objective: boot local WordPress against only repo-owned code and make the workflow reproducible on any machine with Docker.
Status: implemented on 2026-04-02; runtime commands not executed in this environment because `docker` is unavailable

Tasks:
- Update `wordpress/docker-compose.yml` so the runtime mounts only repo-owned theme and `mu-plugin` paths.
- Add a `wp-cli` service if needed so setup and verification can be scripted instead of being manual-only.
- Update `wordpress/.env.example` with the table prefix and any runtime knobs actually needed locally.
- Fix `wordpress/README.md` command paths so commands work from the repo root without ambiguity.
- Document the bootstrap flow:
  - start containers
  - install WordPress locally
  - install/activate WooCommerce
  - import DB only when specifically needed for migration work

Expected file modifications:
- `wordpress/docker-compose.yml`
- `wordpress/.env.example`
- `wordpress/README.md`

Automated success criteria:
- `docker compose --env-file wordpress/.env.example -f wordpress/docker-compose.yml config`
- `docker compose -f wordpress/docker-compose.yml up -d`
- `docker compose -f wordpress/docker-compose.yml ps`
- If `wp-cli` is added: `docker compose -f wordpress/docker-compose.yml run --rm wpcli wp core version`

## Phase 4: Harden The Manual Deployment Workflow
Objective: make code-only deployment predictable and narrow in scope for DonDominio shared hosting.
Status: completed on 2026-04-02

Tasks:
- Update `scripts/wp-push-theme.sh` to deploy only repo-owned theme and `mu-plugin` directories.
- Add a `--dry-run` mode to `scripts/wp-push-theme.sh` so remote targets can be inspected safely before upload.
- Keep `scripts/wp-pull-db.sh` as DB staging only; do not turn it into an automated production import.
- Keep `scripts/wp-pull-uploads.sh` limited to documented subset sync or placeholder behavior.
- Update `thoughts/shared/docs/deploy-wordpress.md` with a pre-deploy checklist and post-deploy verification commands.

Expected file modifications:
- `scripts/wp-push-theme.sh`
- `scripts/wp-pull-db.sh`
- `scripts/wp-pull-uploads.sh`
- `thoughts/shared/docs/deploy-wordpress.md`

Automated success criteria:
- `sh -n scripts/wp-push-theme.sh`
- `sh -n scripts/wp-pull-db.sh`
- `sh -n scripts/wp-pull-uploads.sh`
- `scripts/wp-push-theme.sh --dry-run` prints the local source and remote target paths without uploading.

## Phase 5: Define The Shared Artwork Contract Before Sync
Objective: establish one explicit artwork model shared by the catalog generator and WordPress before any integration logic is built.
Status: completed on 2026-04-02

Tasks:
- Document the canonical artwork fields in `thoughts/shared/docs/artwork-data-contract.md`.
- Align the existing status-label rules in `wordpress/wp-content/mu-plugins/lucia-artwork-rules.php` with the documented contract.
- Extract or codify matching normalization behavior in the catalog generator, starting from `catalog-generator/src/generate.mjs`.
- Keep this phase documentation-first; do not build transport/sync code yet.

Expected file modifications:
- `thoughts/shared/docs/artwork-data-contract.md`
- `wordpress/wp-content/mu-plugins/lucia-artwork-rules.php`
- `catalog-generator/src/generate.mjs`

Automated success criteria:
- `test -f thoughts/shared/docs/artwork-data-contract.md`
- `rg -n "gifted|sold|commissioned|not_for_sale|personal_collection|archived" thoughts/shared/docs/artwork-data-contract.md wordpress/wp-content/mu-plugins/lucia-artwork-rules.php catalog-generator/src/generate.mjs`

## Risks And Mitigations
- Risk: removing `glacier` from the repo reduces short-term visual parity with production.
  - Mitigation: accept functional local parity first and migrate templates intentionally, not by importing vendor debt wholesale.
- Risk: local setup still depends on production DB shape.
  - Mitigation: support a clean local install path first and use DB imports only for targeted migration/debug sessions.
- Risk: deployment scripts accidentally target non-owned remote directories.
  - Mitigation: require explicit remote path variables and a dry-run mode before upload.
- Risk: artwork logic diverges again between WordPress and the PDF generator.
  - Mitigation: define the contract in docs before adding sync code or more rules.

## Phase List
1. Complete audit and lock the architecture decision.
2. Reset the repo to owned code only.
3. Make local runtime disposable and verifiable.
4. Harden the manual deployment workflow.
5. Define the shared artwork contract before sync.

## Next Step
`fic-implement-plan thoughts/shared/plans/2026-04-02-woocommerce-lean-realignment-plan.md`

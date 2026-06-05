# WordPress Skills Routing (mybroworld)

Repo-local WordPress agent skills live under `.agents/skills/`. They are vendored from [wordpress/agent-skills](https://github.com/WordPress/agent-skills) and pinned in `skills-lock.json` at the repository root.

Cursor and Codex expose the same files via project symlinks:

- `.cursor/skills/<name>` → `.agents/skills/<name>`
- `.claude/skills/<name>` → `.agents/skills/<name>` (WordPress skills only today)

## Bootstrap (every WordPress task)

1. Load `.agents/skills/wordpress-router/SKILL.md` first to classify the repo and pick workflows.
2. Run triage when the task touches theme, plugin, MU-plugin, or site structure code:
   - `node .agents/skills/wp-project-triage/scripts/detect_wp_project.mjs`
3. Load the domain skill(s) below before editing PHP, theme assets, REST routes, or ops scripts.
4. For deploy/rollback/remote ops, also read `thoughts/shared/docs/deploy-wordpress.md`.

## mybroworld code surfaces

| Surface | Path |
|--------|------|
| Owned theme | `wordpress/wp-content/themes/luciastuy/` |
| MU-plugins | `wordpress/wp-content/mu-plugins/` |
| Owned plugins | `wordpress/wp-content/plugins/` (custom only) |
| WP ops scripts | `scripts/wp-*.sh` |
| Local runtime | `wordpress/` (see `wordpress/README.md`) |

## Skill index

| Skill | Use when |
|-------|----------|
| `wordpress-router` | Any WordPress/WooCommerce task; routes to the skills below |
| `wp-project-triage` | Classify repo kind, tooling, and recommended checks |
| `wp-block-themes` | `theme.json`, templates, template parts, patterns, style variations (`luciastuy`) |
| `wp-block-development` | Gutenberg blocks, `block.json`, block registration |
| `wp-interactivity-api` | `data-wp-*` directives, Interactivity API stores |
| `wp-plugin-development` | Plugins/MU-plugins, hooks, Settings API, lifecycle, security |
| `wp-rest-api` | `register_rest_route`, controllers, schema, permissions |
| `wp-wpcli-and-ops` | WP-CLI, search-replace, cron, cache, automation |
| `wp-performance` | Profiling, queries, autoload options, object cache, cron |
| `wp-phpstan` | PHPStan config, baselines, WordPress stubs |
| `wp-playground` | Playground CLI, blueprints, disposable environments |
| `blueprint` | WordPress Playground blueprint JSON |
| `wp-abilities-api` | Abilities API registration and REST |
| `wp-plugin-directory-guidelines` | WordPress.org plugin directory compliance |
| `wpds` | WordPress Design System (WPDS) UI work |

## Related project skills

| Skill | Use when |
|-------|----------|
| `mybroworld-sheet-reviewer` | Google Sheets catalog review, normalization, readiness (not WordPress-specific) |

## Decision tree

For keyword → skill mapping after triage, read:

- `.agents/skills/wordpress-router/references/decision-tree.md`

## Guardrails (mybroworld)

- Follow the lean dependency rule in `AGENTS.md` (no commercial paid/freemium plugin churn).
- Prefer owned code under `wordpress/wp-content/themes/luciastuy/` and `mu-plugins/`.
- Production Glacier theme is audit source only; do not treat it as the deployment target.

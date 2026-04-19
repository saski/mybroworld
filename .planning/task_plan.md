# Task Plan

## Goal
Plan a lean strategy to bring the WooCommerce site hosted on DonDominio into this repository for local development, minimizing paid templates and plugins.

## Constraints
- Keep the existing PDF catalog generator architecture intact.
- Prefer minimal moving parts.
- Avoid versioning WordPress core if possible.
- Avoid heavy local platform setup unless it materially reduces risk.
- DonDominio is assumed to be managed hosting with FTP and MySQL access.

## Phases
- [completed] Assess current repo and hosting assumptions
- [completed] Define lean target architecture for repo + local dev
- [completed] Define migration/import path from remote WooCommerce to repo-managed code
- [completed] Define deployment workflow for DonDominio
- [completed] Write implementation plan in thoughts/shared/plans

## Decisions So Far
- Manage custom code only: theme/child-theme, mu-plugins, deployment scripts, env docs.
- Keep WordPress core and vendor plugins out of git.
- Use WooCommerce as operational CMS/storefront, not as the editorial rendering engine.
- Prefer Docker Compose for local runtime because it is portable and keeps setup in the repo.

## Risks
- Unknown DonDominio access level: FTP only vs SSH available.
- Unknown current theme/plugin stack on production.
- Unknown ability to export database/media cleanly.

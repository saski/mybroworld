# Findings

## Repo state
- The repo currently contains only `catalog-generator/` for the PDF workflow.
- There is no WordPress app, theme, plugin, or deployment tooling in the repository.

## Current catalog generator
- Source of truth is currently Google Sheet exported as CSV.
- PDF generation is HTML/CSS + Puppeteer.
- Business rules are already centralized enough to be reused later.

## Hosting assumption
- DonDominio documentation confirms standard hosting workflow via FTP upload and hosting/database management.
- This suggests we should assume a shared-hosting style deployment first, not a server-level workflow.

## Lean strategy implication
- Best repo shape is a "custom-code repo" rather than a full checked-in WordPress installation.
- Local workflow should prefer Docker/LocalWP only if needed for theme/plugin development, while production remains FTP/database based.

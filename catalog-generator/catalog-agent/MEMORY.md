# MEMORY

## Current Decisions

- The first delivery is queue-driven: Google Sheets writes jobs into `catalog_jobs`, and the local agent claims them.
- Job routing is profile-safe. Each local agent instance processes only one `profileKey`.
- The agent reads selected tabs through the Sheets API, merges them locally to CSV, renders with the existing generator, and uploads the PDF to Drive.
- OAuth credentials and refresh tokens stay outside the repository.

## Working Assumptions

- Compatible year tabs are detected from canonical headers, not from a fixed title such as `Sheet1` or `2026`.
- The queue sheet is the system of record for job status transitions.
- Local install paths differ per macOS user, so `workspaceRoot` and `generatorDir` must stay explicit in config.

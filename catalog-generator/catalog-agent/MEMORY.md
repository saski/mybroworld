# MEMORY

## Current Decisions

- The first delivery is queue-driven: Google Sheets writes jobs into `catalog_jobs`, and the catalog agent claims them.
- Job routing is profile-safe. Each agent instance processes only one `profileKey`.
- The agent reads selected tabs through the Sheets API, merges them locally to CSV, renders with the existing generator, and uploads the PDF to Drive.
- OAuth credentials and refresh tokens stay outside the repository.
- Production portability uses a scheduled Cloud Run Job for `lucia-mybrocorp` instead of a customer Mac LaunchAgent.
- Cloud Run secrets are provided as JSON through Secret Manager and materialized into writable runtime files before the normal agent config is loaded.
- The Cloud Run runtime project is `mybroworld-catalog-260501`, administered and billed by `nacho.saski@gmail.com`; daily customer operation should not require Google Cloud access.
- Production WordPress now defaults catalog queue jobs to `lucia-mybrocorp`, so new customer jobs should be claimed by Cloud Run rather than the local `nacho-saski` LaunchAgent.

## Working Assumptions

- Compatible year tabs are detected from canonical headers, not from a fixed title such as `Sheet1` or `2026`.
- The queue sheet is the system of record for job status transitions.
- Local install paths differ per macOS user, so `workspaceRoot` and `generatorDir` must stay explicit in config.
- In Cloud Run, `workspaceRoot` and `generatorDir` point at `/app`, while OAuth and job working paths are rewritten under `CATALOG_AGENT_RUNTIME_ROOT`.
- The Google Auth Platform app remains in Testing mode with `mybrocorp@gmail.com` and `nacho.saski@gmail.com` as test users; test-mode OAuth refresh tokens may expire and need reauthorization.

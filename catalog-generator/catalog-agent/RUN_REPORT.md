# RUN REPORT

## What Was Implemented

- Added the local queue agent core for profile-safe job selection and multi-tab CSV merging.
- Added Google OAuth session handling, including token refresh and a one-time authorization CLI.
- Added Google Sheets and Drive API integration for reading queue rows, updating status, and uploading the rendered PDF.
- Added CLI entrypoints for continuous polling and one-shot verification.

## Verification

- Unit tests cover:
  - compatible-tab discovery and scope resolution
  - queued job defaults and folder validation
  - multi-tab CSV merge behavior
  - profile-safe oldest-job selection
  - generator CLI flags and stable error codes

## Remaining Manual Work

- Copy the Apps Script files into the bound spreadsheet project.
- Create per-profile config files and OAuth client credentials outside the repo.
- Run the acceptance checklist against the live workbook and both Google profiles.

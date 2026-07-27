## Why

The catalog Web App action `list_catalog_image_folders` fails with:

> Los permisos especificados no son suficientes para llamar a DriveApp.getFolderById. Permisos necesarios: (https://www.googleapis.com/auth/drive.readonly || https://www.googleapis.com/auth/drive)

`listCatalogImageFoldersApi_()` (catalog-generator/apps-script/Code.gs:730) calls `DriveApp.getFolderById()` to read the configured image folder (`CATALOG_IMAGE_FOLDER_ID_PROPERTY`, value `1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh`). The deployed Web App could not call Drive because the project manifest (`appsscript.json`) did not declare a Drive OAuth scope. Google never requested Drive consent at deploy time, so the deployment's OAuth token lacked Drive access.

Root cause confirmed by end-to-end test: a POST to the Web App returned exactly the permission error above (verified via the two-step redirect flow: POST → capture `Location` → GET the `script.googleusercontent.com/macros/echo` URL).

## What Changes

- `catalog-generator/apps-script/appsscript.json`: add `https://www.googleapis.com/auth/drive.readonly` to `oauthScopes`.
- No code change in `Code.gs` is required; `listCatalogImageFoldersApi_()` already uses only read operations (`getFolderById`, `getFolders`, `getFiles`), so `drive.readonly` (least privilege) is sufficient over `drive`.
- No change to `executeAs` (stays `USER_DEPLOYING` = deployer's account, which is correct for using the deployer's Drive permissions).

## Capabilities

### Modified Capability: Catalog Web App Authorization

The Apps Script manifest declares the full set of OAuth scopes the Web App needs at runtime, including Drive read access for the image-folder listing API. After the manifest change, a fresh deployment forces Google to request Drive consent, and `list_catalog_image_folders` succeeds.

### Deployment workflow note (non-code)

This repository syncs Apps Script code to Google **manually** (no `clasp`, no `.clasp.json`). The editor at `script.google.com/home/projects/1C0BfkhSDExiq7Ik4jvxoeGzMtNqQsAolMpBzpCqd81iuB5datD43bkot` is the source of truth for the running deployment. The fix only takes effect after: (1) edit `appsscript.json` in the editor to add the scope, (2) save the project, (3) create a **new** deployment (editing an existing deployment does not re-request scopes), (4) accept the Drive consent screen.

## Risks

- Low: `drive.readonly` is read-only; it cannot modify or delete user Drive files.
- Operational: the new deployment ID differs from prior IDs; production references (WordPress, `PROJECT_STATUS.md`) must be updated to the new ID after verification.
- Trap: editing an existing deployment instead of creating a new one will NOT re-prompt for the new scope; the error persists. Must create a new deployment.

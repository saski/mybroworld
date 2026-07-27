# catalog-webapp-auth Specification

## Purpose
TBD - created by archiving change fix-catalog-webapp-drive-scope. Update Purpose after archive.
## Requirements
### Requirement: Web App declares Drive read scope
The catalog Apps Script manifest (`appsscript.json`) SHALL declare `https://www.googleapis.com/auth/drive.readonly` in `oauthScopes` so the Web App can read the configured catalog image folder.

#### Scenario: Drive scope present in manifest
- **GIVEN** the Apps Script project `1C0BfkhSDExiq7Ik4jvxoeGzMtNqQsAolMpBzpCqd81iuB5datD43bkot`
- **WHEN** its `appsscript.json` is inspected
- **THEN** `oauthScopes` contains `https://www.googleapis.com/auth/drive.readonly`

#### Scenario: Fresh deployment requests Drive consent
- **GIVEN** the manifest includes `drive.readonly` and the project is saved
- **WHEN** a NEW deployment is created
- **THEN** Google prompts the deployer to authorize Drive read access

### Requirement: list_catalog_image_folders succeeds when authorized
The Web App action `list_catalog_image_folders` SHALL return the list of subfolders under `CATALOG_IMAGE_FOLDER_ID` when the deployment has Drive read permission.

#### Scenario: Authorized deployment lists folders
- **GIVEN** a deployment whose OAuth token includes `drive.readonly`
- **AND** `CATALOG_IMAGE_FOLDER_ID` is set to `1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh`
- **WHEN** a POST with `{"action":"list_catalog_image_folders","data":{},"token":"<CATALOG_API_TOKEN>"}` is sent
- **THEN** the response is `{"ok":true,"result":{"folders":[...],"rootFolderId":"1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh",...}}`

#### Scenario: Missing Drive scope is rejected clearly
- **GIVEN** a deployment whose OAuth token lacks `drive.readonly`
- **WHEN** the same action is sent
- **THEN** the response is `{"ok":false,"error":{"message":"Los permisos especificados no son suficientes para llamar a DriveApp.getFolderById..."}}`


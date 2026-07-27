## Tasks

- [x] Add `https://www.googleapis.com/auth/drive.readonly` to `oauthScopes` in `catalog-generator/apps-script/appsscript.json` (local edit done; must be mirrored in the Apps Script editor).
- [x] Commit the local `appsscript.json` change to git (so the fix is versioned even though deploy is manual).
- [ ] In the Apps Script editor, mirror the `appsscript.json` scope change and save the project.
- [ ] Create a NEW deployment (Web App) of project `1C0BfkhSDExiq7Ik4jvxoeGzMtNqQsAolMpBzpCqd81iuB5datD43bkot` after the manifest save; accept Drive consent.
- [ ] Capture the new Deployment ID.
- [ ] Run the end-to-end verification curl (two-step redirect) against the new Deployment ID; confirm `{"ok":true,"result":{"folders":[...]}}`.
- [ ] Update `PROJECT_STATUS.md` with the new Deployment ID and the verified scope fix.
- [ ] Update any production reference (WordPress / console) that hard-codes the old Web App Deployment ID.
- [ ] Archive this change once verification passes (`openspec archive fix-catalog-webapp-drive-scope`).

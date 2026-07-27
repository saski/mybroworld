## Tasks

- [x] Add `https://www.googleapis.com/auth/drive.readonly` to `oauthScopes` in `catalog-generator/apps-script/appsscript.json` (local edit done; committed).
- [x] Commit the local `appsscript.json` change to git.
- [x] In the Apps Script editor, mirror the `appsscript.json` scope change and save the project.
- [x] Create a NEW deployment (Web App) of project `1C0BfkhSDExiq7Ik4jvxoeGzMtNqQsAolMpBzpCqd81iuB5datD43bkot` after the manifest save; accept Drive consent.
- [x] Capture the new Deployment ID: `AKfycbxejdh4ap_FloIlAoT0X3QogmxiHkffxNQLq_Mnh0EKZbAiMyL9BsKPzuS4zPKHEAli`.
- [x] Run the end-to-end verification curl against the new Deployment ID; confirmed `{"ok":true,"result":{"folders":[...],"rootFolderId":"1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh"}}`.
- [ ] Update `PROJECT_STATUS.md` with the new Deployment ID and the verified scope fix.
- [ ] Update any production reference (WordPress / console) that hard-codes the old Web App Deployment ID (was `AKfycbz9C2jMtj42LWgWFl1duHEFUiGqs0b6svz0zgcOJjeSQtBUl-8j_iTH7S2iAUIAKVBJ` in prod).
- [ ] Archive this change (`openspec archive fix-catalog-webapp-drive-scope`).

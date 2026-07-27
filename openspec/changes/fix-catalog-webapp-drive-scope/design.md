## Context

The catalog pipeline is: Google Sheets → Apps Script Web App → Cloud Run catalog-agent → PDF.

`list_catalog_image_folders` is a Web App API action used by the catalog console to let operators pick a Drive image folder. It broke after a deployment that did not include the Drive scope.

## Decision

Add `drive.readonly` to `oauthScopes` in `appsscript.json`. Prefer `drive.readonly` over `drive` because the code only reads folder metadata and file counts (no writes/deletes).

Keep `webapp.executeAs: USER_DEPLOYING`. This means the Web App runs as the deployer's account, which is exactly what we want: the anonymous `curl` (or WordPress server-side call) uses the deployer's Drive permissions, not the caller's. (If it were `USER_ACCESSING`, the anonymous caller would have no Drive access and the failure would be worse.)

## Deployment sequence (verified manual workflow)

1. Open the Apps Script editor for project `1C0BfkhSDExiq7Ik4jvxoeGzMtNqQsAolMpBzpCqd81iuB5datD43bkot`.
2. Open `appsscript.json` (Editor `</>` → left file tree → `appsscript.json`, or the gear icon → "View project manifest").
3. Add `"https://www.googleapis.com/auth/drive.readonly"` as the last entry in `oauthScopes`.
4. Save the project (Ctrl+S / disk icon).
5. Deploy → New deployment → Web App → Execute as: deployer account → Access: Anyone → Deploy.
6. Accept the Drive consent screen when prompted.
7. Copy the new Deployment ID.

## Verification

End-to-end test (two-step redirect, because Apps Script Web Apps 302 to `script.googleusercontent.com/macros/echo`):

```bash
WEBAPP="https://script.google.com/macros/s/<NEW_DEPLOYMENT_ID>/exec"
REDIRECT_URL=$(curl -k -s --max-time 30 -X POST "$WEBAPP" \
  -H "Content-Type: application/json" \
  --data-binary @scripts/catalog/list_folders_payload.json \
  -D- 2>/dev/null | grep -i "location:" | sed 's/location: //I' | tr -d '\r')
curl -k -s -L --max-time 60 "$REDIRECT_URL"
```

Expected (success):
```json
{"ok":true,"result":{"folders":[...],"rootFolderId":"1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh","rootFolderName":"..."}}
```

The test payload is committed at `scripts/catalog/list_folders_payload.json` (contains the API token `CATALOG_API_TOKEN`).

## Failure mode

If the response is still `{"error":{"message":"Los permisos especificados no son suficientes..."}}`:
- The manifest edit was not saved before deploying, OR
- An existing deployment was edited instead of a new one created, OR
- The wrong project / an old deployment ID is being tested.
Re-do steps 2–7 above.

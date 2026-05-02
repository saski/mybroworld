import test from 'node:test';
import assert from 'node:assert/strict';

import { GoogleApiClient } from '../catalog-agent/src/google-api.mjs';

test('GoogleApiClient lists Drive folder files with pagination and shared-drive support', async () => {
  const requestedUrls = [];
  const client = new GoogleApiClient({
    oauthSession: {
      authorizedFetch: async (url) => {
        requestedUrls.push(String(url));
        const requestUrl = new URL(url);
        const pageToken = requestUrl.searchParams.get('pageToken');

        return new Response(JSON.stringify(pageToken
          ? {
              files: [
                {
                  id: 'file-2',
                  mimeType: 'image/jpeg',
                  name: 'Beta_cat.jpg',
                },
              ],
            }
          : {
              files: [
                {
                  id: 'file-1',
                  mimeType: 'image/png',
                  name: 'Alpha_cat.png',
                },
              ],
              nextPageToken: 'next-page',
            }), {
          headers: {
            'Content-Type': 'application/json',
          },
          status: 200,
        });
      },
    },
  });

  const files = await client.listDriveFolderFiles('folder-id');

  assert.deepEqual(files.map((file) => file.name), ['Alpha_cat.png', 'Beta_cat.jpg']);
  assert.equal(requestedUrls.length, 2);
  assert.match(requestedUrls[0], /supportsAllDrives=true/);
  assert.match(requestedUrls[0], /includeItemsFromAllDrives=true/);
  assert.match(requestedUrls[1], /pageToken=next-page/);
});

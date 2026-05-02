import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractDriveImageFileId,
  normalizeDriveImageUrl,
} from '../src/drive-image-url.mjs';

test('DriveImageUrl extracts Drive file ids and normalizes them to renderable image URLs', () => {
  assert.equal(
    extractDriveImageFileId('https://drive.google.com/file/d/1abc_DEF-234/view?usp=drive_link'),
    '1abc_DEF-234',
  );
  assert.equal(
    normalizeDriveImageUrl('https://drive.google.com/open?id=1abc_DEF-234'),
    'https://lh3.googleusercontent.com/d/1abc_DEF-234',
  );
});

export function extractDriveImageFileId(url) {
  if (!url) {
    return '';
  }

  const trimmed = String(url).trim();
  const pathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  const queryMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (queryMatch) {
    return queryMatch[1];
  }

  return '';
}

export function normalizeDriveImageUrl(url) {
  if (!url) {
    return '';
  }

  const trimmed = String(url).trim();
  const fileId = extractDriveImageFileId(trimmed);

  return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : trimmed;
}

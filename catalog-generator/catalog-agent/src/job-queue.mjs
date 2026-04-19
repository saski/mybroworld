import { REQUIRED_COMPATIBILITY_HEADERS } from '../../src/catalog-action-contract.mjs';

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function sortHeaders(left, right) {
  const leftRequiredIndex = REQUIRED_COMPATIBILITY_HEADERS.indexOf(left);
  const rightRequiredIndex = REQUIRED_COMPATIBILITY_HEADERS.indexOf(right);

  if (leftRequiredIndex !== -1 && rightRequiredIndex !== -1) {
    return leftRequiredIndex - rightRequiredIndex;
  }

  if (leftRequiredIndex !== -1) {
    return -1;
  }

  if (rightRequiredIndex !== -1) {
    return 1;
  }

  return 0;
}

function collectSheetHeaders(rows) {
  return rows.reduce((headers, row) => {
    Object.keys(row || {}).forEach((header) => headers.add(header));
    return headers;
  }, new Set());
}

function getSheetHeaders(sheetJob) {
  const explicitHeaders = Array.isArray(sheetJob.headers)
    ? sheetJob.headers
      .map((header) => String(header || '').trim())
      .filter(Boolean)
    : [];

  if (explicitHeaders.length > 0) {
    return explicitHeaders.sort(sortHeaders);
  }

  return [...collectSheetHeaders(sheetJob.rows || [])].sort(sortHeaders);
}

export function mergeCatalogSheetsToCsv(sheetJobs) {
  const mergedHeaders = [];
  const mergedHeaderSet = new Set();

  const allRows = sheetJobs.flatMap((sheetJob) => {
    const rows = sheetJob.rows || [];
    const sheetHeaders = getSheetHeaders(sheetJob);
    const missingHeaders = REQUIRED_COMPATIBILITY_HEADERS.filter((header) => !sheetHeaders.includes(header));

    if (missingHeaders.length > 0) {
      throw new Error(`Sheet "${sheetJob.title}" is missing required headers: ${missingHeaders.join(', ')}`);
    }

    sheetHeaders.forEach((header) => {
      if (!mergedHeaderSet.has(header)) {
        mergedHeaderSet.add(header);
        mergedHeaders.push(header);
      }
    });

    return rows;
  });

  const lines = [
    mergedHeaders.join(','),
    ...allRows.map((row) => mergedHeaders.map((header) => escapeCsvCell(row[header])).join(',')),
  ];

  return `${lines.join('\n')}\n`;
}

export function findOldestQueuedJob({ executionProfile, jobs }) {
  const queuedJobs = (jobs || [])
    .filter((job) => job.status === 'queued')
    .filter((job) => job.execution_profile === executionProfile)
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());

  return queuedJobs[0] || null;
}

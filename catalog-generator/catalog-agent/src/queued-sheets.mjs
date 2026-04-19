import { CatalogAgentError } from './errors.mjs';

function parseJsonArrayField(value, fieldName) {
  let parsedValue;

  try {
    parsedValue = JSON.parse(value || '[]');
  } catch (error) {
    throw new CatalogAgentError({
      cause: error,
      code: 'job_payload_invalid',
      message: `Job field "${fieldName}" is not valid JSON.`,
    });
  }

  if (!Array.isArray(parsedValue)) {
    throw new CatalogAgentError({
      code: 'job_payload_invalid',
      message: `Job field "${fieldName}" must contain an array.`,
    });
  }

  return parsedValue;
}

function normalizeMetadataSheets(spreadsheetMetadata) {
  return Array.isArray(spreadsheetMetadata?.sheets)
    ? spreadsheetMetadata.sheets
      .map((sheet) => sheet?.properties || {})
      .filter((properties) => Number.isFinite(Number(properties.sheetId)) && String(properties.title || '').trim() !== '')
    : [];
}

export function resolveQueuedSheetsForProcessing({ job, spreadsheetMetadata }) {
  const queuedSheetIds = parseJsonArrayField(job.sheet_ids_json, 'sheet_ids_json')
    .map((sheetId) => Number(sheetId))
    .filter((sheetId) => Number.isFinite(sheetId));
  const queuedSheetTitles = parseJsonArrayField(job.sheet_titles_json, 'sheet_titles_json')
    .map((title) => String(title || '').trim());
  const metadataSheets = normalizeMetadataSheets(spreadsheetMetadata);

  if (queuedSheetIds.length > 0) {
    const metadataById = new Map(metadataSheets.map((properties) => [Number(properties.sheetId), properties]));

    return queuedSheetIds.map((sheetId, index) => {
      const matchedSheet = metadataById.get(sheetId);
      if (!matchedSheet) {
        throw new CatalogAgentError({
          code: 'queued_sheet_missing',
          message: `Queued sheet id "${sheetId}" is no longer present in the spreadsheet.`,
        });
      }

      return {
        currentTitle: String(matchedSheet.title).trim(),
        queuedTitle: queuedSheetTitles[index] || '',
        sheetId,
      };
    });
  }

  if (queuedSheetTitles.length > 0) {
    const metadataByTitle = new Map(metadataSheets.map((properties) => [String(properties.title).trim(), properties]));

    return queuedSheetTitles.map((queuedTitle) => {
      const matchedSheet = metadataByTitle.get(queuedTitle);
      if (!matchedSheet) {
        throw new CatalogAgentError({
          code: 'queued_sheet_missing',
          message: `Queued sheet title "${queuedTitle}" is no longer present in the spreadsheet.`,
        });
      }

      return {
        currentTitle: String(matchedSheet.title).trim(),
        queuedTitle,
        sheetId: Number(matchedSheet.sheetId),
      };
    });
  }

  throw new CatalogAgentError({
    code: 'job_payload_invalid',
    message: 'Queued job does not contain any target sheets.',
  });
}

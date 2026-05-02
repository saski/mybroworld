import fs from 'node:fs/promises';

import { CatalogAgentError } from './errors.mjs';
import { columnNumberToA1, quoteSheetTitle } from './utils.mjs';

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeDriveQueryValue(value) {
  return String(value).replaceAll("'", "\\'");
}

function mapValuesRow(headers, rowValues) {
  return headers.reduce((row, header, index) => {
    row[header] = rowValues[index] ?? '';
    return row;
  }, {});
}

export function buildHeaderMap(headers) {
  return headers.reduce((headerMap, header, index) => {
    headerMap[normalizeHeader(header)] = index + 1;
    return headerMap;
  }, {});
}

async function parseJsonResponse(response, fallbackCode) {
  const responseText = await response.text();
  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new CatalogAgentError({
      cause: error,
      code: `${fallbackCode}_parse`,
      message: `Unexpected JSON response from Google API: ${responseText}`,
    });
  }
}

export class GoogleApiClient {
  constructor({ oauthSession }) {
    this.oauthSession = oauthSession;
  }

  async requestJson({ body, errorCode = 'google_api_request_failed', method = 'GET', url }) {
    const response = await this.oauthSession.authorizedFetch(url, {
      body: body ? JSON.stringify(body) : undefined,
      headers: body
        ? {
            'Content-Type': 'application/json',
          }
        : undefined,
      method,
    });

    const payload = await parseJsonResponse(response, errorCode);
    if (!response.ok) {
      const errorMessage = payload.error?.message || payload.error?.status || `Google API request failed with ${response.status}.`;
      throw new CatalogAgentError({
        code: errorCode,
        message: errorMessage,
      });
    }

    return payload;
  }

  async getSpreadsheetMetadata(spreadsheetId) {
    const fields = encodeURIComponent('sheets(properties(sheetId,title,hidden))');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=${fields}`;
    return this.requestJson({
      errorCode: 'spreadsheet_metadata_failed',
      url,
    });
  }

  async getSheetValues(spreadsheetId, sheetTitle) {
    const range = `${quoteSheetTitle(sheetTitle)}!A:ZZ`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?majorDimension=ROWS`;
    const payload = await this.requestJson({
      errorCode: 'sheet_values_failed',
      url,
    });

    return payload.values || [];
  }

  async getSheetRows(spreadsheetId, sheetTitle) {
    const values = await this.getSheetValues(spreadsheetId, sheetTitle);
    if (values.length === 0) {
      return {
        headers: [],
        rows: [],
      };
    }

    const headers = values[0].map((header) => String(header || '').trim());
    const rows = values
      .slice(1)
      .filter((rowValues) => rowValues.some((value) => String(value || '').trim() !== ''))
      .map((rowValues) => mapValuesRow(headers, rowValues));

    return {
      headers,
      rows,
    };
  }

  async getJobsSheetRecords(spreadsheetId) {
    const { headers, rows } = await this.getSheetRows(spreadsheetId, 'catalog_jobs');
    const normalizedHeaders = headers.map(normalizeHeader);

    return {
      headerMap: buildHeaderMap(headers),
      headers,
      records: rows.map((row, index) => ({
        ...normalizedHeaders.reduce((record, header, headerIndex) => {
          record[header] = row[headers[headerIndex]] ?? '';
          return record;
        }, {}),
        rowNumber: index + 2,
      })),
    };
  }

  async updateSheetRowFields({ headerMap, rowNumber, sheetTitle, spreadsheetId, updates }) {
    const updateEntries = Object.entries(updates).filter(([, value]) => value !== undefined);
    if (updateEntries.length === 0) {
      return;
    }

    const data = updateEntries.map(([fieldName, value]) => {
      const columnNumber = headerMap[normalizeHeader(fieldName)];
      if (!columnNumber) {
        throw new CatalogAgentError({
          code: 'jobs_sheet_header_missing',
          message: `Field "${fieldName}" is missing from ${sheetTitle}.`,
        });
      }

      const columnLabel = columnNumberToA1(columnNumber);
      return {
        range: `${quoteSheetTitle(sheetTitle)}!${columnLabel}${rowNumber}`,
        values: [[value]],
      };
    });

    await this.requestJson({
      body: {
        data,
        valueInputOption: 'RAW',
      },
      errorCode: 'sheet_update_failed',
      method: 'POST',
      url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    });
  }

  async listDriveFolderFiles(folderId) {
    const files = [];
    let pageToken = '';

    do {
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('q', `'${escapeDriveQueryValue(folderId)}' in parents and trashed = false`);
      url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size,modifiedTime)');
      url.searchParams.set('pageSize', '1000');
      url.searchParams.set('supportsAllDrives', 'true');
      url.searchParams.set('includeItemsFromAllDrives', 'true');
      url.searchParams.set('orderBy', 'name_natural');
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const payload = await this.requestJson({
        errorCode: 'drive_folder_list_failed',
        url: String(url),
      });
      files.push(...(payload.files || []));
      pageToken = payload.nextPageToken || '';
    } while (pageToken);

    return files;
  }

  async uploadPdfToDrive({ fileName, filePath, folderId }) {
    const fileContents = await fs.readFile(filePath);
    const boundary = `catalog-agent-${Date.now()}`;
    const metadata = {
      mimeType: 'application/pdf',
      name: fileName,
      parents: [folderId],
    };

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`),
      fileContents,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const response = await this.oauthSession.authorizedFetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        body,
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        method: 'POST',
      },
    );

    const payload = await parseJsonResponse(response, 'drive_upload_failed');
    if (!response.ok) {
      throw new CatalogAgentError({
        code: 'drive_upload_failed',
        message: payload.error?.message || `Drive upload failed with ${response.status}.`,
      });
    }

    const fileId = payload.id;
    return {
      fileId,
      fileName: payload.name || fileName,
      fileUrl: payload.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    };
  }
}

import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const generatorRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

class FakeRange {
  constructor(sheet, row, column, rowCount = 1, columnCount = 1) {
    this.column = column;
    this.columnCount = columnCount;
    this.row = row;
    this.rowCount = rowCount;
    this.sheet = sheet;
  }

  getValues() {
    return this.sheet.readRange(this.row, this.column, this.rowCount, this.columnCount);
  }

  getDisplayValues() {
    return this.getValues().map((row) => row.map((value) => String(value ?? '')));
  }

  setFontWeight() {
    return this;
  }

  setValue(value) {
    this.sheet.writeRange(this.row, this.column, [[value]]);
    return this;
  }

  setValues(values) {
    this.sheet.writeRange(this.row, this.column, values);
    return this;
  }
}

class FakeSheet {
  constructor({ headers = [], hidden = false, rows = [], sheetId, title }) {
    this.hidden = hidden;
    this.maxColumns = Math.max(headers.length, ...rows.map((row) => row.length), 1);
    this.sheetId = sheetId;
    this.title = title;
    this.values = [headers, ...rows].map((row) => [...row]);
  }

  appendRow(row) {
    this.values.push([...row]);
  }

  getDataRange() {
    return new FakeRange(this, 1, 1, Math.max(this.values.length, 1), this.getLastColumn());
  }

  getDisplayValues() {
    return this.getDataRange().getDisplayValues();
  }

  getLastColumn() {
    return Math.max(this.maxColumns, ...this.values.map((row) => row.length), 0);
  }

  getLastRow() {
    return this.values.length;
  }

  getMaxColumns() {
    return this.maxColumns;
  }

  getName() {
    return this.title;
  }

  getRange(row, column, rowCount = 1, columnCount = 1) {
    return new FakeRange(this, row, column, rowCount, columnCount);
  }

  getSheetId() {
    return this.sheetId;
  }

  hideSheet() {
    this.hidden = true;
  }

  insertColumnsAfter(afterColumn, howMany) {
    this.maxColumns = Math.max(this.maxColumns, afterColumn + howMany);
  }

  isSheetHidden() {
    return this.hidden;
  }

  readRange(row, column, rowCount, columnCount) {
    return Array.from({ length: rowCount }, (_, rowOffset) => {
      const sourceRow = this.values[row - 1 + rowOffset] || [];
      return Array.from({ length: columnCount }, (_, columnOffset) => {
        return sourceRow[column - 1 + columnOffset] ?? '';
      });
    });
  }

  setFrozenRows() {}

  showSheet() {
    this.hidden = false;
  }

  writeRange(row, column, values) {
    values.forEach((sourceRow, rowOffset) => {
      const targetRowIndex = row - 1 + rowOffset;
      while (this.values.length <= targetRowIndex) {
        this.values.push([]);
      }

      sourceRow.forEach((value, columnOffset) => {
        const targetColumnIndex = column - 1 + columnOffset;
        this.values[targetRowIndex][targetColumnIndex] = value;
        this.maxColumns = Math.max(this.maxColumns, targetColumnIndex + 1);
      });
    });
  }
}

class FakeSpreadsheet {
  constructor({ activeSheetId, sheets }) {
    this.sheets = sheets.map((sheet) => new FakeSheet(sheet));
    this.activeSheetId = activeSheetId;
  }

  getActiveSheet() {
    return this.sheets.find((sheet) => sheet.getSheetId() === this.activeSheetId) || this.sheets[0];
  }

  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.getName() === name) || null;
  }

  getSheets() {
    return this.sheets;
  }

  insertSheet(name) {
    const nextSheetId = Math.max(0, ...this.sheets.map((sheet) => sheet.getSheetId())) + 1;
    const sheet = new FakeSheet({
      headers: [],
      rows: [],
      sheetId: nextSheetId,
      title: name,
    });
    this.sheets.push(sheet);
    return sheet;
  }

  setActiveSheet(sheet) {
    this.activeSheetId = sheet.getSheetId();
  }

  toast() {}
}

function createContentService() {
  return {
    MimeType: {
      JSON: 'application/json',
    },
    createTextOutput(contents) {
      return {
        contents,
        mimeType: '',
        setMimeType(mimeType) {
          this.mimeType = mimeType;
          return this;
        },
      };
    },
  };
}

function parseTextOutput(output) {
  return JSON.parse(output.contents);
}

export async function loadAppsScriptCatalogApi({
  activeSheetId,
  apiToken,
  sheets,
}) {
  const spreadsheet = new FakeSpreadsheet({ activeSheetId, sheets });
  let uuidCounter = 0;
  const context = {
    ContentService: createContentService(),
    Date,
    HtmlService: {},
    JSON,
    Math,
    Number,
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(name) {
            return name === 'CATALOG_API_TOKEN' ? apiToken : '';
          },
        };
      },
      getUserProperties() {
        return {
          getProperty() {
            return '';
          },
          setProperty() {},
        };
      },
    },
    Session: {
      getActiveUser() {
        return {
          getEmail() {
            return '';
          },
        };
      },
    },
    SpreadsheetApp: {
      getActive() {
        return spreadsheet;
      },
    },
    String,
    Utilities: {
      getUuid() {
        uuidCounter += 1;
        return `test-${String(uuidCounter).padStart(4, '0')}`;
      },
    },
  };

  vm.createContext(context);
  const source = await fs.readFile(path.join(generatorRoot, 'apps-script', 'Code.gs'), 'utf8');
  vm.runInContext(`${source}
globalThis.__catalogTestApi = {
  handleCatalogApiRequest_: handleCatalogApiRequest_,
};
`, context);

  return {
    callApi(event) {
      return parseTextOutput(context.__catalogTestApi.handleCatalogApiRequest_(event));
    },
    spreadsheet,
  };
}

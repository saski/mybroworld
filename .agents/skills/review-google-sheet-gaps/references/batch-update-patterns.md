# Batch Update Patterns

Use this reference when building raw Google Sheets `batchUpdate` requests for gap review work.

## Index Rules

- `sheetId` comes from spreadsheet metadata, not the tab order.
- Row and column indexes are zero-based.
- `startRowIndex` and `startColumnIndex` are inclusive.
- `endRowIndex` and `endColumnIndex` are exclusive.
- Example: sheet row `19`, column `I` maps to `startRowIndex: 18` and `startColumnIndex: 8`.

## Write a Single Cell Value

Use `updateCells` when changing the cell content:

```json
{
  "updateCells": {
    "start": {
      "sheetId": 102593401,
      "rowIndex": 20,
      "columnIndex": 19
    },
    "rows": [
      {
        "values": [
          {
            "userEnteredValue": {
              "stringValue": "Dani Coronado y Emilio"
            }
          }
        ]
      }
    ],
    "fields": "userEnteredValue"
  }
}
```

## Color an Unresolved Cell

Use `repeatCell` when changing only formatting:

```json
{
  "repeatCell": {
    "range": {
      "sheetId": 102593401,
      "startRowIndex": 18,
      "endRowIndex": 19,
      "startColumnIndex": 8,
      "endColumnIndex": 9
    },
    "cell": {
      "userEnteredFormat": {
        "backgroundColor": {
          "red": 1,
          "green": 0.8,
          "blue": 0.8
        }
      }
    },
    "fields": "userEnteredFormat.backgroundColor"
  }
}
```

## Typical Mixed Batch

Group deterministic fills before color flags:

1. `updateCells` for inferred values.
2. `repeatCell` for unresolved cells.
3. Optional final readback with `include_spreadsheet_in_response` when verification matters.

## Safety Rules

- Keep requests narrow and cell-specific.
- Do not send formatting fields when only value changes are needed.
- Do not send value fields when only coloring unresolved cells.
- Re-read edited cells after a meaningful write batch if the user asked for confirmation.

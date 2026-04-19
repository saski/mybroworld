import path from 'node:path';

export function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function truncateText(value, maxLength = 500) {
  const text = String(value || '');
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

export function expandHomePath(inputPath, homeDirectory) {
  if (!inputPath || inputPath === '~') {
    return homeDirectory;
  }

  if (inputPath.startsWith('~/')) {
    return path.join(homeDirectory, inputPath.slice(2));
  }

  return inputPath;
}

export function columnNumberToA1(columnNumber) {
  let value = Number(columnNumber);
  let label = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }

  return label;
}

export function quoteSheetTitle(sheetTitle) {
  return `'${String(sheetTitle || '').replace(/'/g, "''")}'`;
}

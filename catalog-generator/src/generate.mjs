#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { renderCatalogHtml } from './template.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key?.startsWith('--')) {
      args[key.slice(2)] = value && !value.startsWith('--') ? value : 'true';
      if (value && !value.startsWith('--')) i += 1;
    }
  }
  return args;
}

function normalizeBoolean(value) {
  if (value === undefined || value === null) return false;
  const text = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 'sí', 'si'].includes(text);
}

function statusLabel(status) {
  switch ((status || '').trim().toLowerCase()) {
    case 'gifted':
    case 'exchanged':
    case 'personal_collection':
    case 'archived':
      return 'Obra histórica';
    case 'sold':
    case 'commissioned':
    case 'not_for_sale':
      return 'Obra no disponible';
    default:
      return '';
  }
}

function buildTechnique(row) {
  const medium = (row.medium_clean || '').trim();
  const support = (row.support_clean || '').trim();
  if (medium && support) return `${medium} sobre ${support}`;
  return medium || support || '';
}

function toSortableNumber(value, fallback = 999999) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDriveImage(url) {
  if (!url) return '';
  const trimmed = String(url).trim();

  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  const idMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  return trimmed;
}

async function readCsv({ inputPath, inputUrl }) {
  if (inputUrl) {
    const response = await fetch(inputUrl);
    if (!response.ok) {
      throw new Error(`No se pudo descargar el CSV: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }
  if (!inputPath) {
    throw new Error('Debes pasar --input data/catalog.csv o GOOGLE_SHEET_CSV_URL');
  }
  return await fs.readFile(inputPath, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.input || process.env.CATALOG_INPUT || '';
  const inputUrl = process.env.GOOGLE_SHEET_CSV_URL || '';
  const outputPath = args.output || 'output/catalogo.pdf';
  const limit = args.limit ? Number(args.limit) : null;

  const csvText = await readCsv({ inputPath, inputUrl });
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });

  const artworks = records
    .filter((row) => normalizeBoolean(row.include_in_catalog) && normalizeBoolean(row.catalog_ready))
    .map((row) => {
      const status = (row.status_normalized || '').trim().toLowerCase();
      const showPrice = normalizeBoolean(row.show_price) && status === 'available';
      const note = (row.catalog_notes_public || '').trim();
      return {
        artworkId: (row.artwork_id || '').trim(),
        title: (row.title_clean || row.title_raw || '').trim(),
        year: (row.year || '').trim(),
        technique: buildTechnique(row),
        dimensions: (row.dimensions_clean || '').trim(),
        imageUrl: normalizeDriveImage(row.image_main),
        status,
        statusLabel: statusLabel(status),
        showPrice,
        price: showPrice ? (row.price_display_clean || '').trim() : '',
        note,
        section: (row.catalog_section || '').trim().toLowerCase() || (status === 'available' ? 'available' : 'historical'),
        order: toSortableNumber(row.catalog_order, 999999),
      };
    })
    .filter((row) => row.title && row.imageUrl)
    .sort((a, b) => {
      const sec = a.section.localeCompare(b.section);
      if (sec !== 0) return sec;
      const order = a.order - b.order;
      if (order !== 0) return order;
      return a.title.localeCompare(b.title);
    });

  const finalArtworks = Number.isFinite(limit) ? artworks.slice(0, limit) : artworks;

  const html = renderCatalogHtml(finalArtworks, {
    artistName: 'Lucía Astuy',
    catalogTitle: 'Catálogo 2026'
  });

  const htmlPath = path.join(path.dirname(outputPath), 'catalogo-preview.html');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(htmlPath, html, 'utf8');

  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
  });
  await browser.close();

  console.log(`PDF generado: ${outputPath}`);
  console.log(`HTML de preview: ${htmlPath}`);
  console.log(`Obras incluidas: ${finalArtworks.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

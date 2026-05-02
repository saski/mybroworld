import { parse } from 'csv-parse/sync';

import { normalizeCatalogStatus } from './shared-catalog-contract.mjs';

function parseCsvRecords(csvText) {
  return parse(csvText, {
    bom: true,
    columns: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function normalizeBoolean(value) {
  return ['true', '1', 'yes', 'y', 'sí', 'si'].includes(String(value || '').trim().toLowerCase());
}

function normalizeTitleKey(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function compareByTitle(left, right) {
  return left.title.localeCompare(right.title);
}

function normalizeStatus(value) {
  return normalizeCatalogStatus(value);
}

function normalizePrice(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.');
}

function statusPolicy(status) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === 'available') {
    return {
      catalogVisibility: 'visible',
      productStatus: 'publish',
      purchasable: true,
      stockStatus: 'instock',
    };
  }

  if (normalizedStatus === 'archived') {
    return {
      catalogVisibility: 'hidden',
      productStatus: 'publish',
      purchasable: false,
      stockStatus: 'outofstock',
    };
  }

  return {
    catalogVisibility: 'visible',
    productStatus: 'publish',
    purchasable: false,
    stockStatus: 'outofstock',
  };
}

export function parseSheetInventoryCsv(csvText, { scope = 'all' } = {}) {
  return parseCsvRecords(csvText)
    .map((row) => ({
      artworkId: String(row.artwork_id || '').trim(),
      catalogReady: normalizeBoolean(row.catalog_ready),
      includeInCatalog: normalizeBoolean(row.include_in_catalog),
      status: normalizeStatus(row.status_normalized),
      title: String(row.title_clean || row.title_raw || '').trim(),
    }))
    .filter((row) => /^LA-\d{4}-\d+$/u.test(row.artworkId) && row.title)
    .filter((row) => {
      if (scope === 'catalog_ready') {
        return row.includeInCatalog && row.catalogReady;
      }

      if (scope === 'available') {
        return normalizeStatus(row.status) === 'available';
      }

      return true;
    });
}

export function parseWooProductCsv(csvText) {
  return parseCsvRecords(csvText)
    .map((row) => ({
      id: String(row.ID || row.id || '').trim(),
      slug: String(row.post_name || row.slug || '').trim(),
      status: String(row.post_status || row.status || '').trim(),
      title: String(row.post_title || row.name || row.title || '').trim(),
    }))
    .filter((row) => row.title)
    .sort(compareByTitle);
}

export function compareInventoryByTitle({ sheetArtworks, wooProducts }) {
  const wooByTitle = new Map(wooProducts.map((product) => [normalizeTitleKey(product.title), product]));
  const sheetByTitle = new Map(sheetArtworks.map((artwork) => [normalizeTitleKey(artwork.title), artwork]));

  const missingInWoo = sheetArtworks
    .filter((artwork) => !wooByTitle.has(normalizeTitleKey(artwork.title)))
    .sort(compareByTitle);

  const unexpectedInWoo = wooProducts
    .filter((product) => !sheetByTitle.has(normalizeTitleKey(product.title)))
    .sort(compareByTitle);

  return {
    inSync: missingInWoo.length === 0 && unexpectedInWoo.length === 0,
    missingInWoo,
    unexpectedInWoo,
  };
}

export function buildWooProductDrafts(sheetCsvText) {
  return parseCsvRecords(sheetCsvText)
    .map((row) => {
      const artworkId = String(row.artwork_id || '').trim();
      const name = String(row.title_clean || row.title_raw || '').trim();
      const status = normalizeStatus(row.status_normalized);
      const policy = statusPolicy(status);

      return {
        artworkId,
        catalogVisibility: policy.catalogVisibility,
        description: [
          String(row.medium_clean || '').trim(),
          String(row.support_clean || '').trim(),
          String(row.dimensions_clean || '').trim(),
        ].filter(Boolean).join(' | '),
        imageUrl: String(row.image_main || '').trim(),
        manageStock: false,
        meta: {
          _lucia_artwork_id: artworkId,
          _lucia_artwork_status: status,
          _lucia_current_location: String(row.location_clean || '').trim(),
          _lucia_location_history: String(row.location_history || '').trim(),
          _lucia_series_name: String(row.series_name || '').trim(),
        },
        name,
        productStatus: policy.productStatus,
        purchasable: policy.purchasable,
        regularPrice: policy.purchasable ? normalizePrice(row.price_eur) : '',
        shortDescription: String(row.catalog_notes_public || '').trim(),
        sku: artworkId,
        stockStatus: policy.stockStatus,
        type: 'simple',
      };
    })
    .filter((draft) => /^LA-\d{4}-\d+$/u.test(draft.artworkId) && draft.name);
}

export function buildInventoryParityReport({ sheetCsvText, wooCsvText, scope = 'all' }) {
  const sheetArtworks = parseSheetInventoryCsv(sheetCsvText, { scope });
  const wooProducts = parseWooProductCsv(wooCsvText);
  const comparison = compareInventoryByTitle({ sheetArtworks, wooProducts });

  return {
    inSync: comparison.inSync,
    missingInWoo: comparison.missingInWoo,
    scope,
    sheetCount: sheetArtworks.length,
    unexpectedInWoo: comparison.unexpectedInWoo,
    wooCount: wooProducts.length,
  };
}

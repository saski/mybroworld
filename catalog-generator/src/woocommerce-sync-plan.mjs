import { parse } from 'csv-parse/sync';

import { buildWooProductDrafts } from './commerce-inventory-parity.mjs';
import {
  extractDriveImageFileId,
  normalizeDriveImageUrl,
} from './drive-image-url.mjs';
import { normalizeCatalogStatus } from './shared-catalog-contract.mjs';

const ARTWORK_ID_PATTERN = /^LA-\d{4}-\d+$/u;

function parseCsvRecords(csvText) {
  return parse(csvText, {
    bom: true,
    columns: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function rowText(row, key) {
  return String(row[key] || '').trim();
}

function isCandidateArtworkRow(row) {
  const artworkId = rowText(row, 'artwork_id');
  const title = rowText(row, 'title_clean') || rowText(row, 'title_raw');
  const status = rowText(row, 'status_normalized');
  const imageMain = rowText(row, 'image_main');

  return ARTWORK_ID_PATTERN.test(artworkId) || artworkId === '' && (title || status || imageMain) || imageMain !== '';
}

function validateSourceRows(sheetCsvText) {
  const invalidArtworkIds = new Set();
  const invalidActions = [];
  const validationErrors = [];

  parseCsvRecords(sheetCsvText).forEach((row, index) => {
    if (!isCandidateArtworkRow(row)) {
      return;
    }

    const artworkId = rowText(row, 'artwork_id');
    const title = rowText(row, 'title_clean') || rowText(row, 'title_raw');
    const status = rowText(row, 'status_normalized');
    const imageMain = rowText(row, 'image_main');
    const errors = [];

    if (!ARTWORK_ID_PATTERN.test(artworkId)) {
      errors.push('missing_artwork_id');
    }

    if (!title) {
      errors.push('missing_title_clean');
    }

    if (!normalizeCatalogStatus(status)) {
      errors.push('unknown_status_normalized');
    }

    if (!imageMain) {
      errors.push('missing_image_main');
    } else if (!extractDriveImageFileId(imageMain)) {
      errors.push('invalid_image_main');
    }

    if (errors.length === 0) {
      return;
    }

    if (artworkId) {
      invalidArtworkIds.add(artworkId);
    }

    const validationError = {
      artworkId,
      errors,
      rowNumber: index + 2,
    };

    validationErrors.push(validationError);
    invalidActions.push({
      action: 'invalid_source',
      artworkId,
      errors,
      rowNumber: validationError.rowNumber,
    });
  });

  return {
    invalidActions,
    invalidArtworkIds,
    validationErrors,
  };
}

function metaValue(product, key) {
  const meta = Array.isArray(product.meta_data) ? product.meta_data : [];
  const entry = meta.find((item) => item?.key === key);

  return String(entry?.value || '').trim();
}

function productArtworkId(product) {
  const metaArtworkId = metaValue(product, '_lucia_artwork_id');
  const sku = String(product.sku || '').trim();

  if (ARTWORK_ID_PATTERN.test(metaArtworkId)) {
    return metaArtworkId;
  }

  if (ARTWORK_ID_PATTERN.test(sku)) {
    return sku;
  }

  return '';
}

function productHasImages(product) {
  return Array.isArray(product.images) && product.images.length > 0;
}

function productFieldValue(product, key) {
  return String(product[key] ?? '').trim();
}

function productMetaMatches(product, draft) {
  return Object.entries(syncMeta(draft)).every(([key, value]) => metaValue(product, key) === value);
}

function productMatchesDraft(product, draft) {
  return (
    productFieldValue(product, 'name') === draft.name &&
    productFieldValue(product, 'type') === draft.type &&
    productFieldValue(product, 'status') === draft.productStatus &&
    productFieldValue(product, 'sku') === draft.sku &&
    productFieldValue(product, 'catalog_visibility') === draft.catalogVisibility &&
    productFieldValue(product, 'regular_price') === draft.regularPrice &&
    productFieldValue(product, 'stock_status') === draft.stockStatus &&
    Boolean(product.manage_stock) === draft.manageStock &&
    productMetaMatches(product, draft)
  );
}

function productPayload(draft, existingProduct = null) {
  const imageFileId = extractDriveImageFileId(draft.imageUrl);
  const imageUrl = normalizeDriveImageUrl(draft.imageUrl);
  const existingImageId = existingProduct && metaValue(existingProduct, '_lucia_image_file_id') === imageFileId
    ? existingProduct.images?.[0]?.id
    : null;
  const images = existingImageId
    ? [{ id: existingImageId }]
    : imageFileId ? [{
      alt: draft.name,
      name: draft.name,
      src: imageUrl,
    }] : [];

  return {
    catalog_visibility: draft.catalogVisibility,
    description: draft.description,
    images,
    manage_stock: draft.manageStock,
    meta_data: Object.entries(syncMeta(draft)).map(([key, value]) => ({ key, value })),
    name: draft.name,
    regular_price: draft.regularPrice,
    short_description: draft.shortDescription,
    sku: draft.sku,
    status: draft.productStatus,
    stock_status: draft.stockStatus,
    type: draft.type,
  };
}

function syncMeta(draft) {
  const imageFileId = extractDriveImageFileId(draft.imageUrl);

  return {
    ...draft.meta,
    ...(imageFileId ? { _lucia_image_file_id: imageFileId } : {}),
  };
}

export function buildWooCommerceSyncPlan({ sheetCsvText, wooProducts = [] }) {
  const existingByArtworkId = new Map();
  const {
    invalidActions,
    invalidArtworkIds,
    validationErrors,
  } = validateSourceRows(sheetCsvText);
  const actions = [...invalidActions];

  for (const product of wooProducts) {
    const artworkId = productArtworkId(product);

    if (artworkId) {
      existingByArtworkId.set(artworkId, product);
    }
  }

  for (const draft of buildWooProductDrafts(sheetCsvText).filter((item) => !invalidArtworkIds.has(item.artworkId))) {
    const existingProduct = existingByArtworkId.get(draft.artworkId);
    const payload = productPayload(draft, existingProduct);

    if (!existingProduct) {
      actions.push({
        action: 'create',
        artworkId: draft.artworkId,
        payload,
      });
      continue;
    }

    if (!productHasImages(existingProduct)) {
      actions.push({
        action: 'needs_image',
        artworkId: draft.artworkId,
        payload,
        productId: existingProduct.id,
      });
      continue;
    }

    actions.push({
      action: productMatchesDraft(existingProduct, draft) ? 'unchanged' : 'update',
      artworkId: draft.artworkId,
      payload,
      productId: existingProduct.id,
    });
  }

  for (const product of wooProducts) {
    if (productArtworkId(product)) {
      continue;
    }

    actions.push({
      action: 'unexpected_unmanaged',
      product: {
        id: product.id,
        name: String(product.name || '').trim(),
        sku: String(product.sku || '').trim(),
        status: String(product.status || '').trim(),
      },
      productId: product.id,
    });
  }

  return {
    actions,
    validationErrors,
  };
}

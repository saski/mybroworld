import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWooProductDrafts,
  buildInventoryParityReport,
  parseSheetInventoryCsv,
  parseWooProductCsv,
} from '../src/commerce-inventory-parity.mjs';

test('parseSheetInventoryCsv keeps canonical artwork rows and ignores helper tables', () => {
  const records = parseSheetInventoryCsv(`artwork_id,title_clean,status_normalized,include_in_catalog,catalog_ready
LA-2026-001,Perrete en tablillas 01,available,TRUE,TRUE
LA-2026-002,La chica sonríe porque pinta,gifted,TRUE,TRUE
,,available,TRUE,TRUE
availability_flag_raw,status_normalized,boolean_flag,location_clean
`);

  assert.deepEqual(records, [
    {
      artworkId: 'LA-2026-001',
      catalogReady: true,
      includeInCatalog: true,
      status: 'available',
      title: 'Perrete en tablillas 01',
    },
    {
      artworkId: 'LA-2026-002',
      catalogReady: true,
      includeInCatalog: true,
      status: 'gifted',
      title: 'La chica sonríe porque pinta',
    },
  ]);
});

test('buildInventoryParityReport reports missing and unexpected WooCommerce products by title', () => {
  const report = buildInventoryParityReport({
    sheetCsvText: `artwork_id,title_clean,status_normalized,include_in_catalog,catalog_ready
LA-2026-001,Perrete en tablillas 01,available,TRUE,TRUE
LA-2026-002,More human than human,available,TRUE,TRUE
`,
    wooCsvText: `ID,post_title,post_status,post_name
1,Perrete en tablillas 01,publish,perrete-en-tablillas-01
2,Armchair,publish,armchair
`,
  });

  assert.equal(report.sheetCount, 2);
  assert.equal(report.wooCount, 2);
  assert.deepEqual(report.missingInWoo.map((item) => item.title), ['More human than human']);
  assert.deepEqual(report.unexpectedInWoo.map((item) => item.title), ['Armchair']);
  assert.equal(report.inSync, false);
});

test('parseWooProductCsv reads WP-CLI product list CSV', () => {
  assert.deepEqual(
    parseWooProductCsv(`ID,post_title,post_status,post_name
742,Bottle,publish,bottle
`),
    [
      {
        id: '742',
        slug: 'bottle',
        status: 'publish',
        title: 'Bottle',
      },
    ],
  );
});

test('buildWooProductDrafts includes all canonical artworks and maps status to visibility and purchasability', () => {
  const drafts = buildWooProductDrafts(`artwork_id,title_clean,status_normalized,include_in_catalog,catalog_ready,price_eur,dimensions_clean,medium_clean,support_clean,image_main,location_clean,location_history,series_name,catalog_notes_public
LA-2026-001,Available work,available,FALSE,FALSE,260,23 x 16 cm,Acrílico,cartón,https://example.test/available.jpg,El Grifo,El Grifo,Series A,
LA-2026-002,Sold work,sold,TRUE,TRUE,320,20 x 20 cm,Collage,lienzo,https://example.test/sold.jpg,Juan Roller,El Grifo -> Juan Roller,,
LA-2026-003,Archived work,archived,TRUE,TRUE,480,33 x 24 cm,Tinta,papel,https://example.test/archived.jpg,,,,Archive note
`);

  assert.deepEqual(
    drafts.map((draft) => ({
      artworkId: draft.artworkId,
      catalogVisibility: draft.catalogVisibility,
      name: draft.name,
      purchasable: draft.purchasable,
      regularPrice: draft.regularPrice,
      sku: draft.sku,
      stockStatus: draft.stockStatus,
    })),
    [
      {
        artworkId: 'LA-2026-001',
        catalogVisibility: 'visible',
        name: 'Available work',
        purchasable: true,
        regularPrice: '260',
        sku: 'LA-2026-001',
        stockStatus: 'instock',
      },
      {
        artworkId: 'LA-2026-002',
        catalogVisibility: 'visible',
        name: 'Sold work',
        purchasable: false,
        regularPrice: '',
        sku: 'LA-2026-002',
        stockStatus: 'outofstock',
      },
      {
        artworkId: 'LA-2026-003',
        catalogVisibility: 'hidden',
        name: 'Archived work',
        purchasable: false,
        regularPrice: '',
        sku: 'LA-2026-003',
        stockStatus: 'outofstock',
      },
    ],
  );
});

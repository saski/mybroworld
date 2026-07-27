# Tasks: catalog-image-priority

## Implementation Tasks

- [x] 0.1 Update `buildCatalogImageManifest()` to include all image files (not just `_cat`) and tag each with priority: `_CAT01` = 1, other `_cat*` = 2, no suffix = 3
- [x] 0.1b **Fix: revert to only _cat files in manifest.** Previous change broke production by including non-_cat files causing false image matches. Now: only `_cat` files with priority; fall back to `image_main` from spreadsheet when no `_cat` match exists.
- [x] 0.2 Update `resolveCatalogImageUrl()` to select by priority (lowest number wins) with alphabetical tiebreaker, falling back to `image_main` when no match
- [x] 0.3 Write tests: _CAT01 selected over other variants, fallback to spreadsheet image_main, fallback when no _cat files exist
- [x] 0.4 Run full test suite (54 tests pass)
- [x] 0.5 OpenSpec validation passes
- [ ] 0.6 Deploy to Cloud Run and verify catalog in production

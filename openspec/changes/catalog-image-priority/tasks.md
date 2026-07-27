# Tasks: catalog-image-priority

## Implementation Tasks

- [x] 0.1 Update `buildCatalogImageManifest()` to include all image files (not just `_cat`) and tag each with priority: `_CAT01` = 1, other `_cat*` = 2, no suffix = 3
- [x] 0.2 Update `resolveCatalogImageUrl()` to select by priority (lowest number wins) with alphabetical tiebreaker, removing the "exactly 1 match" requirement
- [x] 0.3 Write tests: _CAT01 selected over other variants, fallback to base image, error when no images
- [x] 0.4 Run full test suite (49 tests pass)
- [x] 0.5 OpenSpec validation passes
- [ ] 0.6 Commit and push to remote

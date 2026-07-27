## Why

The catalog generator needs a deterministic image selection rule. Each artwork may have multiple image variants in the Drive folder (e.g., `ART001_CAT01.jpg`, `ART001_CAT02.jpg`, `ART001.jpg`). The customer requires that the image with suffix `_CAT01` is always used when available, with other variants as fallback.

## What Changes

- Image selection priority: `_CAT01` > other `_cat*` > no suffix
- When `_CAT01` exists for an artwork, it is always selected regardless of other variants
- When no `_CAT01` exists, fall back to any `_cat*` variant, then to the base image
- If multiple files exist at the same priority level, use the first alphabetically
- Error if no images found for an artwork (existing behavior preserved)

## Capabilities

### Modified Capability: Catalog Image Selection

The `buildCatalogImageManifest()` and `resolveCatalogImageUrl()` functions in `catalog-generator/src/catalog-generator.mjs` will be updated to:

1. Include ALL image files in the manifest (not just `_cat` suffixed)
2. Tag each file with a priority level based on its suffix
3. Select the highest-priority file when resolving an artwork's image

## Risks

- Low: This is a pure selection logic change; no data format or API changes
- Low: Existing catalogs generated with `_cat` only will continue to work since `_CAT01` is a subset of `_cat`

# Baseline exploration — supergreat

**Date:** 2026-05-16  
**Canonical URL:** `/portfolio/supergreat/`  
**Secondary reference:** `/portfolio/super-supergreat/` (different metadata label set)

## 1.1 Screenshot capture

Commands:

```bash
VIEWPORTS="desktop:1440x1100,tablet:1024x900,mobile:390x844@2"
PATHS="/portfolio/supergreat/"

node scripts/woo-visual-baseline.mjs \
  --base-url https://www.luciastuy.com \
  --label live-production \
  --paths "$PATHS" \
  --viewports "$VIEWPORTS" \
  --out-dir openspec/changes/align-luciastuy-catalog-item-parity/evidence/screenshots/2026-05-16-supergreat/live

node scripts/woo-visual-baseline.mjs \
  --base-url http://localhost:8090 \
  --label luciastuy-local \
  --paths "$PATHS" \
  --viewports "$VIEWPORTS" \
  --out-dir openspec/changes/align-luciastuy-catalog-item-parity/evidence/screenshots/2026-05-16-supergreat/local
```

| Viewport | Live | Local |
|----------|------|-------|
| Desktop 1440×1100 | `live/live-production-desktop-portfolio-supergreat.png` | `local/luciastuy-local-desktop-portfolio-supergreat.png` |
| Tablet 1024×900 | `live/live-production-tablet-portfolio-supergreat.png` | `local/luciastuy-local-tablet-portfolio-supergreat.png` |
| Mobile 390×844@2 | `live/live-production-mobile-portfolio-supergreat.png` | `local/luciastuy-local-mobile-portfolio-supergreat.png |

Manifests: `live/manifest.json`, `local/manifest.json`.

## Visual summary (from screenshots)

| Area | Live (Glacier) | Local (`luciastuy`) |
|------|----------------|---------------------|
| Primary viewport | Left column: stacked gallery images with lightbox links; right column: title, excerpt, metadata block | Title + short excerpt only; no gallery column; large empty main area |
| Metadata | Four labeled rows (Págs, Tamaño, Impresión, Fecha) | Not rendered |
| Bottom nav | Prev/Next project links with icons | Absent |
| Header/footer | Glacier header + footer | Owned `luciastuy` header/footer (identity slice already applied) |

## 1.2 DOM structure

See [dom-structure-diff.md](./dom-structure-diff.md).

## 1.3 Metadata source

See [metadata-source-mapping.md](./metadata-source-mapping.md).

## 1.4 Parity gaps

See [parity-checklist.md](./parity-checklist.md).

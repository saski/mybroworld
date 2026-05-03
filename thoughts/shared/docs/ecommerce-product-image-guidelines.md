# Ecommerce Product Image Guidelines

## Purpose

Use these rules for Lucia Astuy WooCommerce product images so the shop feels like a gallery website while preserving artwork truth.

## Primary Image Rules

- Every product must have one truthful primary image of the actual artwork or product being sold.
- The primary image must not be AI-generated, composited, stylized, or materially altered.
- The full artwork should be visible unless the product itself is a detail, book spread, or intentionally cropped edition.
- Product thumbnails should use a stable square frame with the artwork contained inside it, not cropped to fill at the cost of accuracy.
- Use a quiet neutral background for thumbnail frames so works with different aspect ratios still feel consistent.
- Keep the artwork scale visually consistent across products where source image quality allows it.
- Avoid excessive white margins inside the source image when the artwork becomes too small in a product card.

## Quality Checks

- The image must load through WordPress/WooCommerce media in the storefront.
- The image must be large enough to look sharp in a desktop product detail layout.
- The image must have useful alt text that identifies the artwork or product.
- The image must not depend on a live Google Drive URL in the rendered storefront.
- The image must not require a gallery, optimization, or AI WordPress plugin.

Run this read-only audit before customer validation when product image readiness is in scope:

```bash
WOO_BASE_URL=https://www.luciastuy.com scripts/woo-image-quality-audit.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv
```

Use stricter thresholds only when source dimensions are available in the Store API response, for example:

```bash
WOO_BASE_URL=https://www.luciastuy.com scripts/woo-image-quality-audit.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --min-images 2 --min-width 1600 --min-height 1200
```

## Secondary Image Rules

- Secondary images may show detail crops, framing context, book spreads, or installation context.
- Secondary images can use generated or composited context only after explicit review.
- Secondary AI-assisted images must never become the first gallery image or thumbnail.
- Any secondary image role should be explicit: `detail`, `context`, `installation`, `book_spread`, or `mockup`.

## UX Reference Mapping

- `Artlogic trust`: primary product and detail images should feel calm, spacious, and collector-ready.
- `AOTM editorial`: use distinctive image/editorial treatment only for collection or story surfaces.
- `Objkt utility`: use compact image metadata only when it improves scanning, filtering, or buying confidence.
- `reject`: any image pattern that requires adding a runtime WordPress plugin or misrepresents the product.

## Screenshot-Specific Notes

- The fourth related product in the captured product-page screenshot appears too small because the artwork sits inside a large white source area. Treat that as a source-image normalization issue first and a CSS frame issue second.
- Related products need one consistent frame system so the user can compare works without card jumps.
- Cart actions should align independently from image aspect ratio or title length.

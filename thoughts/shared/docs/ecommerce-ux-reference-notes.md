# Ecommerce UX Reference Notes

## Decision

The Lucia Astuy shop should use Artlogic as the customer-confidence anchor, AOTM as a controlled editorial influence, and Objkt as a utility reference for discovery and transaction clarity.

## Reference Classification

| Source | Use | Apply To | Avoid |
|---|---|---|---|
| Artlogic | `Artlogic trust` | Shop grid, product detail, navigation, artwork metadata, calm purchase/enquiry flow | SaaS marketing sections, platform messaging, website-builder dependency |
| AOTM | `AOTM editorial` | Collections, featured sections, editorial/story pages, selected section labels | Experimental navigation in purchase flows, oversized branding in checkout, digital-only assumptions |
| Objkt | `Objkt utility` | Search, filters, sorting, availability signals, compact grid metadata | Wallet/web3 flows, token language, auction/edition assumptions, dense marketplace chrome for small catalogs |

## Implementation Rule

Every reference-inspired UI decision must be classified as one of:

- `Artlogic trust`
- `AOTM editorial`
- `Objkt utility`
- `reject`

Reject any pattern that requires a new WordPress runtime plugin, weakens product truth, or makes checkout/product-detail flows harder to understand.

## Accepted Starting Blend

- Product cards: mostly `Artlogic trust`, with small `Objkt utility` labels for price and availability.
- Product detail: `Artlogic trust` hierarchy with artwork first, then title, price/status, action, essential metadata, and related works.
- Collections/editorial: limited `AOTM editorial` borders, typographic confidence, and feature modules.
- Search/filter/sort: `Objkt utility` only when the catalog size makes discovery meaningfully better.

## Not Accepted

- Fixing shop UX through Glacier, Elementor, Slider Revolution, or builder-specific markup.
- Adding product-gallery, visual merchandising, AI image, image optimizer, or related-product plugins.
- Using AI-generated media as the primary product image.

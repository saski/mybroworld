# Parity checklist — catalog item page (local vs live)

**Date:** 2026-05-16  
**Evidence:** [screenshots/2026-05-16-supergreat/](./screenshots/2026-05-16-supergreat/)

| # | Requirement | Live | Local | Status |
|---|-------------|------|-------|--------|
| 1 | Desktop two-column layout (media + info) | Yes | Yes (2026-05-16 impl) | PASS |
| 2 | Gallery stack with multiple images | 3 images | 3 images | PASS |
| 3 | Image click / expand affordance | Fancybox | Owned lightbox | PASS (lean overlay; not Fancybox) |
| 4 | Title hierarchy (`SuperGreat`) | `h4.title-project` | `h1` + uppercase Dosis | PASS |
| 5 | Short description under title | Yes | Yes | PASS |
| 6 | Metadata block with labeled rows | 4 rows | 4 rows | PASS |
| 7 | Bottom prev/next navigation | Yes | Yes (menu_order + date DESC) | PASS |
| 8 | Header identity (logo, menu, cart) | Glacier | Owned slice | PASS (separate change) |
| 9 | Footer | Glacier | Owned slice | PASS (separate change) |
| 10 | Tablet layout readable | Two-column / compressed | Title only | FAIL |
| 11 | Mobile stacked layout | Image-first stack | Title only | FAIL |
| 12 | Dosis / Source Sans Pro on item surfaces | Kirki inline | Theme fonts loaded globally | UNVERIFIED on item page (no item-specific rules yet) |

## Screenshot links

| Viewport | Live | Local |
|----------|------|-------|
| Desktop | `live/live-production-desktop-portfolio-supergreat.png` | `local/luciastuy-local-desktop-portfolio-supergreat.png` |
| Tablet | `live/live-production-tablet-portfolio-supergreat.png` | `local/luciastuy-local-tablet-portfolio-supergreat.png` |
| Mobile | `live/live-production-mobile-portfolio-supergreat.png` | `local/luciastuy-local-mobile-portfolio-supergreat.png` |

## Allowed exceptions (none yet)

| ID | Area | Reason | Approved by |
|----|------|--------|---------------|
| — | — | — | — |

Format for future exceptions: `ID`, `surface`, `live vs owned delta`, `reason`, `approver`, `expiry`.

# DOM structure diff — single portfolio item

**Date:** 2026-05-16  
**Compared URLs:** live `https://www.luciastuy.com/portfolio/supergreat/` vs local `http://localhost:8090/portfolio/supergreat/`

## Template / body

| Signal | Live (Glacier) | Local (`luciastuy`) |
|--------|----------------|---------------------|
| Theme | `wp-theme-glacier` | `wp-theme-luciastuy` |
| Body classes | `single-portfolio`, `portfolio-template-default`, `postid-2397`, builder markers (`wpb-js-composer`, `elementor-default`) | Same post type/id classes; builder markers still present from DB content |
| Main template | Glacier `single-portfolio` PHP layout (Bootstrap `container` / `row` / `col-md-*`) | Generic `index.php` loop |

## Wrapper hierarchy (live)

```
body.single-portfolio
└── header (Glacier: .logo, #glacier_menu, .cart-container)
└── .container
    └── .row
        ├── .col-md-7          ← media column
        │   └── .gallery-projects.one (×N)
        │       └── .overlay-box
        │           └── a[data-fancybox=gallery] > img
        └── .col-md-5.single-project   ← info column
            ├── h4.title-project
            ├── p (excerpt / description)
            └── .project-details
                └── h5 + p pairs (metadata)
└── .portfolio-single-nav
    └── .single-navigation
        ├── .next-button > a.single-link-nav
        └── .prev-button > a.single-link-nav
└── footer.footer
```

## Wrapper hierarchy (local)

```
body.single-portfolio
└── header.site-header (owned identity)
└── main.site-main
    └── article.post-2397.portfolio
        ├── h1.site-page-title
        └── (empty — the_content() renders only the excerpt paragraph)
└── footer.site-footer
```

## Block-level gaps

| Block | Live selector / region | Local |
|-------|------------------------|-------|
| Media column | `.col-md-7`, `.gallery-projects` | Missing |
| Info column | `.col-md-5.single-project` | Collapsed into generic `article` |
| Metadata | `.project-details` with `h5` labels | Missing |
| Item navigation | `.portfolio-single-nav`, `.single-navigation` | Missing |
| Lightbox | `data-fancybox="gallery"` on gallery anchors | Missing (no gallery anchors) |

## Scripts / assets (live only, not required to copy)

- Fancybox / Visual Portfolio front-end (`VPData`, `.vp-portfolio__*` CSS) on live; local page still loads some VP-related inline CSS from content/DB but does not render the gallery markup.
- Glacier Kirki inline typography tokens (`#glacier_menu`, `.title-project`, etc.).

## Implementation implication

Owned theme must **replace** the Glacier layout with a dedicated single-portfolio template; styling generic `.site-main article` is insufficient because the required regions are not present in the DOM today.

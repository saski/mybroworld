# Lucía Astuy Catalog Generator

Genera un catálogo PDF a partir de un CSV exportado desde Google Sheets.

## Flujo

1. Exporta tu hoja normalizada a CSV.
2. Guarda el archivo como `data/catalog.csv`.
3. Ejecuta:

```bash
npm install
npm run generate -- --input data/catalog.csv --output output/catalogo.pdf
```

También puedes usar una URL pública de exportación CSV de Google Sheets:

```bash
GOOGLE_SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..." npm run generate -- --output output/catalogo.pdf
```

## Campos esperados en el CSV

Columnas mínimas:

- `title_clean`
- `year`
- `medium_clean`
- `support_clean`
- `dimensions_clean`
- `status_normalized`
- `price_display_clean`
- `image_main`
- `include_in_catalog`
- `catalog_ready`
- `catalog_section`
- `catalog_order`
- `show_price`
- `catalog_notes_public`

## Reglas incluidas

- Solo entra una obra si:
  - `include_in_catalog = TRUE`
  - `catalog_ready = TRUE`
- El precio solo aparece si:
  - `status_normalized = available`
  - `show_price = TRUE`
- Si no hay precio visible, se muestra una etiqueta editorial:
  - `Reservada`
  - `Obra no disponible`
  - `Obra histórica`

## Scripts

```bash
npm run generate
```

## Notas

- El PDF se renderiza con HTML/CSS + Puppeteer.
- El CSS está pensado para A4 vertical.
- La plantilla actual usa una imagen grande y el texto abajo.
- Puedes afinar la estética en `src/styles.css` y `src/template.js`.

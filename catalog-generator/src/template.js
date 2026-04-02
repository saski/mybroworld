import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const styles = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderArtworkPage(artwork) {
  const priceOrStatus = artwork.showPrice && artwork.price
    ? `<div class="price">${escapeHtml(artwork.price)}</div>`
    : artwork.statusLabel
      ? `<div class="status">${escapeHtml(artwork.statusLabel)}</div>`
      : '';

  const note = artwork.note
    ? `<div class="note">${escapeHtml(artwork.note)}</div>`
    : '';

  return `
    <section class="page artwork-page">
      <div class="image-frame">
        <img src="${escapeHtml(artwork.imageUrl)}" alt="${escapeHtml(artwork.title)}" />
      </div>
      <div class="meta">
        <div class="title">${escapeHtml(artwork.title)}</div>
        <div class="year">${escapeHtml(artwork.year)}</div>
        <div class="technique">${escapeHtml(artwork.technique)}</div>
        <div class="dimensions">${escapeHtml(artwork.dimensions)}</div>
        ${priceOrStatus}
        ${note}
      </div>
    </section>
  `;
}

export function renderCatalogHtml(artworks, { artistName, catalogTitle }) {
  const pages = artworks.map(renderArtworkPage).join('\n');
  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(catalogTitle)}</title>
      <style>${styles}</style>
    </head>
    <body>
      <section class="page cover-page">
        <div class="cover-inner">
          <h1>${escapeHtml(artistName)}</h1>
          <div class="cover-subtitle">${escapeHtml(catalogTitle)}</div>
          <div class="cover-edition">Versión de validación</div>
        </div>
      </section>

      ${pages}

      <section class="page closing-page">
        <div class="closing-inner">
          <div class="closing-name">${escapeHtml(artistName)}</div>
          <div class="closing-contact">hola@luciastuy.com</div>
          <div class="closing-contact">635 166 253</div>
        </div>
      </section>
    </body>
  </html>`;
}

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

function loadAssetDataUri(fileName, mimeType) {
  try {
    const assetPath = path.join(__dirname, '..', 'assets', fileName);
    const assetBuffer = fs.readFileSync(assetPath);
    return `data:${mimeType};base64,${assetBuffer.toString('base64')}`;
  } catch {
    return '';
  }
}

const referenceCoverPhoto = loadAssetDataUri('reference-cover.jpg', 'image/jpeg');
const referenceWordmark = loadAssetDataUri('reference-wordmark.png', 'image/png');
const referenceWordmarkDark = loadAssetDataUri('reference-wordmark-dark.png', 'image/png');

function renderWordmark({ artistName, className = '', tone = 'light' }) {
  const classes = ['catalog-wordmark', className, tone === 'dark' ? 'catalog-wordmark-dark' : '']
    .filter(Boolean)
    .join(' ');
  const source = tone === 'dark' && referenceWordmarkDark
    ? referenceWordmarkDark
    : referenceWordmark;

  if (source) {
    return `<img class="${classes}" src="${escapeHtml(source)}" alt="${escapeHtml(artistName)}" />`;
  }

  return `<div class="${classes} catalog-wordmark-text">${escapeHtml(artistName)}</div>`;
}

function renderCoverCaption({ catalogPeriodLabel, catalogTitle }) {
  const secondaryLabel = catalogPeriodLabel || catalogTitle;

  return `
    <div class="cover-caption">
      <span class="cover-caption-status">${escapeHtml(catalogTitle)}</span>
      <span class="cover-separator">|</span>
      <span class="cover-caption-secondary">${escapeHtml(secondaryLabel)}</span>
    </div>
  `;
}

function resolveArtworkPageLabel(artwork) {
  if (artwork.statusLabel) {
    return artwork.statusLabel;
  }

  return artwork.section === 'historical' ? 'Obra histórica' : 'Obra disponible';
}

function renderArtworkKicker(artwork) {
  return `
    <div class="artwork-kicker">
      <span class="artwork-kicker-primary">Catálogo</span>
      <span class="artwork-kicker-separator">|</span>
      <span class="artwork-kicker-secondary">${escapeHtml(resolveArtworkPageLabel(artwork))}</span>
    </div>
  `;
}

function renderArtworkPage(artwork, { artistName }) {
  const priceOrStatus = artwork.showPrice && artwork.price
    ? `<div class="artwork-price">${escapeHtml(artwork.price)}</div>`
    : artwork.statusLabel
      ? `<div class="artwork-status">${escapeHtml(artwork.statusLabel)}</div>`
      : '';

  const note = artwork.note
    ? `<div class="artwork-note">${escapeHtml(artwork.note)}</div>`
    : '';

  const year = artwork.year
    ? `<div class="artwork-year">${escapeHtml(artwork.year)}</div>`
    : '';

  const dimensions = artwork.dimensions
    ? `<div class="artwork-meta-line">${escapeHtml(artwork.dimensions)}</div>`
    : '';

  const technique = artwork.technique
    ? `<div class="artwork-meta-line">${escapeHtml(artwork.technique)}</div>`
    : '';

  return `
    <section class="page artwork-page">
      <div class="artwork-header">
        ${renderArtworkKicker(artwork)}
        ${renderWordmark({ artistName, className: 'artwork-header-wordmark', tone: 'dark' })}
      </div>
      <div class="artwork-shell">
        <div class="artwork-stage">
          <div class="artwork-stage-frame">
            <img class="artwork-image" src="${escapeHtml(artwork.imageUrl)}" alt="${escapeHtml(artwork.title)}" />
          </div>
        </div>
        <div class="artwork-meta-block">
          <div class="artwork-title">${escapeHtml(artwork.title)}</div>
          ${year}
          ${dimensions}
          ${technique}
          ${priceOrStatus}
          ${note}
        </div>
      </div>
    </section>
  `;
}

export function renderCatalogHtml(artworks, { artistName, catalogTitle, catalogPeriodLabel }) {
  const pages = artworks
    .map((artwork) => renderArtworkPage(artwork, { artistName }))
    .join('\n');

  const coverPhoto = referenceCoverPhoto || artworks[0]?.imageUrl || '';
  const coverLabel = artworks[0] ? resolveArtworkPageLabel(artworks[0]) : catalogTitle;
  const coverPhotoMarkup = coverPhoto
    ? `<img class="cover-photo" src="${escapeHtml(coverPhoto)}" alt="${escapeHtml(`${artistName} cover portrait`)}" />`
    : '<div class="cover-photo cover-photo-fallback"></div>';

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
        ${coverPhotoMarkup}
        <div class="cover-footer">
          ${renderCoverCaption({ catalogPeriodLabel, catalogTitle: coverLabel })}
          ${renderWordmark({ artistName, className: 'cover-wordmark', tone: 'light' })}
        </div>
      </section>

      ${pages}

      <section class="page closing-page">
        <div class="closing-brand-stack">
          ${renderWordmark({ artistName, className: 'closing-wordmark', tone: 'dark' })}
          <div class="closing-inner">
            <div class="closing-contact">hola@luciastuy.com</div>
            <div class="closing-contact">635.166.253</div>
          </div>
        </div>
      </section>
    </body>
  </html>`;
}

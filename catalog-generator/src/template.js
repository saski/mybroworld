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

function renderFontFace({ fileName, fontStyle = 'normal', fontWeight }) {
  const source = loadAssetDataUri(`fonts/${fileName}`, 'font/otf');
  if (!source) {
    return '';
  }

  return `
@font-face {
  font-family: "Gotham";
  font-style: ${fontStyle};
  font-weight: ${fontWeight};
  src: url("${source}") format("opentype");
}
`;
}

const catalogFontFaces = [
  renderFontFace({ fileName: 'Gotham-Book.otf', fontWeight: 400 }),
  renderFontFace({ fileName: 'Gotham-Medium.otf', fontWeight: 500 }),
  renderFontFace({ fileName: 'Gotham-Bold.otf', fontWeight: 700 }),
  renderFontFace({ fileName: 'Gotham-Black.otf', fontWeight: 800 }),
].join('');

const customerWordmarkDark = loadAssetDataUri('brand/LOGO_LA_2.png', 'image/png');
const customerWordmarkLight = loadAssetDataUri('brand/logo_blanco_transp_2.png', 'image/png');
const referenceCoverPhoto = loadAssetDataUri('reference-cover.jpg', 'image/jpeg');
const referenceWordmark = loadAssetDataUri('reference-wordmark.png', 'image/png');
const referenceWordmarkDark = loadAssetDataUri('reference-wordmark-dark.png', 'image/png');

function renderWordmark({ artistName, className = '', tone = 'light' }) {
  const classes = ['catalog-wordmark', className, tone === 'dark' ? 'catalog-wordmark-dark' : '']
    .filter(Boolean)
    .join(' ');
  const source = tone === 'dark'
    ? customerWordmarkDark || referenceWordmarkDark || referenceWordmark
    : customerWordmarkLight || referenceWordmark || customerWordmarkDark || referenceWordmarkDark;

  if (source) {
    return `<img class="${classes}" src="${escapeHtml(source)}" alt="${escapeHtml(artistName)}" />`;
  }

  return `<div class="${classes} catalog-wordmark-text">${escapeHtml(artistName)}</div>`;
}

function renderCoverCaption({ catalogTitle }) {
  return `
    <div class="cover-caption">
      <span class="cover-caption-status">${escapeHtml(catalogTitle)}</span>
    </div>
  `;
}

function renderArtworkPage(artwork, { artistName }) {
  const price = artwork.showPrice && artwork.price
    ? `<div class="artwork-price">${escapeHtml(artwork.price)}</div>`
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
        <div></div>
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
          ${price}
        </div>
      </div>
    </section>
  `;
}

export function renderCatalogHtml(artworks, { artistName, catalogTitle }) {
  const pages = artworks
    .map((artwork) => renderArtworkPage(artwork, { artistName }))
    .join('\n');

  const coverPhoto = referenceCoverPhoto || artworks[0]?.imageUrl || '';
  const coverPhotoMarkup = coverPhoto
    ? `<img class="cover-photo" src="${escapeHtml(coverPhoto)}" alt="${escapeHtml(`${artistName} cover portrait`)}" />`
    : '<div class="cover-photo cover-photo-fallback"></div>';

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(catalogTitle)}</title>
      <style>${catalogFontFaces}${styles}</style>
    </head>
    <body>
      <section class="page cover-page">
        ${coverPhotoMarkup}
        <div class="cover-footer">
          ${renderCoverCaption({ catalogTitle })}
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
            <div class="closing-contact">IG: @luciastuy</div>
            <div class="closing-contact">www.luciastuy.com</div>
          </div>
        </div>
      </section>
    </body>
  </html>`;
}

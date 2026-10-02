/**
 * MAISON ÉTÉ · Dynamic Image Loader
 * Accepts any extension and any letter case via import.meta.glob
 * Provides getImage(name) with exact and fuzzy matching
 */

const files = import.meta.glob(
  '/src/assets/img/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}',
  { eager: true, query: '?url', import: 'default' }
);

// Map of lowercase base name without extension -> URL
const imageMap = new Map();
// Array of entries for fuzzy matching
const imageEntries = [];

for (const [path, url] of Object.entries(files)) {
  const filename = path.split('/').pop() || '';
  const lastDot = filename.lastIndexOf('.');
  const basename = (lastDot !== -1 ? filename.substring(0, lastDot) : filename).toLowerCase().trim();

  imageMap.set(basename, url);
  imageEntries.push({
    path,
    filename,
    basename,
    cleanKey: basename.replace(/[-_ ]/g, ''),
    url,
  });
}

/**
 * Get image URL by name with exact and fuzzy matching
 * @param {string} name - e.g. "hero", "courtyard", "suite-1", "suite-2", "suite-3", "pool", "dining", "spa"
 * @returns {string|null} - Resolved image URL or null if no match found
 */
export function getImage(name) {
  if (!name) return null;
  const raw = String(name).trim();
  const lastDot = raw.lastIndexOf('.');
  const baseName = (lastDot !== -1 ? raw.substring(0, lastDot) : raw).toLowerCase().trim();
  const cleanKey = baseName.replace(/[-_ ]/g, '');

  // 1. Exact match by lowercase base name
  if (imageMap.has(baseName)) {
    return imageMap.get(baseName);
  }

  // 2. Normalized match (ignoring dashes/underscores/spaces)
  for (const entry of imageEntries) {
    if (entry.cleanKey === cleanKey) {
      return entry.url;
    }
  }

  // 3. Fuzzy match: entry basename starts with search key or vice-versa
  for (const entry of imageEntries) {
    if (entry.basename.startsWith(baseName) || entry.cleanKey.startsWith(cleanKey)) {
      return entry.url;
    }
  }

  // 4. Fuzzy match: entry basename contains search key or vice-versa
  // e.g. "pool" matches "Pool_1.png" or "Gemini_Generated_Image pool"
  for (const entry of imageEntries) {
    if (entry.basename.includes(baseName) || entry.cleanKey.includes(cleanKey)) {
      return entry.url;
    }
  }

  for (const entry of imageEntries) {
    if (baseName.includes(entry.basename) || cleanKey.includes(entry.cleanKey)) {
      return entry.url;
    }
  }

  return null;
}

/**
 * Audit all expected images and return match status
 */
export function auditImages() {
  const expected = ['hero', 'courtyard', 'suite-1', 'suite-2', 'suite-3', 'pool', 'dining', 'spa'];
  const matched = [];
  const missing = [];

  for (const key of expected) {
    const url = getImage(key);
    if (url) {
      matched.push({ key, url });
    } else {
      missing.push(key);
    }
  }

  return { matched, missing, filesInFolder: imageEntries.map(e => e.filename) };
}

/**
 * Apply resolved images to all <img> and CSS backgrounds throughout the document
 */
export function initAllImages() {
  const targets = [
    { key: 'hero', selector: '#hero .hero__img', placeholder: '#hero .hero__img-placeholder' },
    { key: 'courtyard', selector: '.story__arch-img', placeholder: '.story__arch-placeholder' },
    { key: 'courtyard', selector: '.reserve__image-inner img', placeholder: null },
    { key: 'suite-1', selector: '.suites__panel:nth-child(1) .suites__img-inner img', placeholder: '.suites__panel:nth-child(1) .suites__img-placeholder' },
    { key: 'suite-1', selector: '.suites__mobile-panel:nth-child(1) img', placeholder: '.suites__mobile-panel:nth-child(1) .suites__mobile-img-placeholder' },
    { key: 'suite-1', selector: '.suite-card[data-suite="0"] .suite-card__thumb img', placeholder: '.suite-card[data-suite="0"] .suite-card__thumb-placeholder' },
    { key: 'suite-2', selector: '.suites__panel:nth-child(2) .suites__img-inner img', placeholder: '.suites__panel:nth-child(2) .suites__img-placeholder' },
    { key: 'suite-2', selector: '.suites__mobile-panel:nth-child(2) img', placeholder: '.suites__mobile-panel:nth-child(2) .suites__mobile-img-placeholder' },
    { key: 'suite-2', selector: '.suite-card[data-suite="1"] .suite-card__thumb img', placeholder: '.suite-card[data-suite="1"] .suite-card__thumb-placeholder' },
    { key: 'suite-3', selector: '.suites__panel:nth-child(3) .suites__img-inner img', placeholder: '.suites__panel:nth-child(3) .suites__img-placeholder' },
    { key: 'suite-3', selector: '.suites__mobile-panel:nth-child(3) img', placeholder: '.suites__mobile-panel:nth-child(3) .suites__mobile-img-placeholder' },
    { key: 'suite-3', selector: '.suite-card[data-suite="2"] .suite-card__thumb img', placeholder: '.suite-card[data-suite="2"] .suite-card__thumb-placeholder' },
    { key: 'pool', selector: '.story__img-block--tall img', placeholder: '.story__img-block--tall .story__img-block-placeholder' },
    { key: 'spa', selector: '.story__img-block--wide img', placeholder: '.story__img-block--wide .story__img-block-placeholder' },
    { key: 'dining', selector: '.exp__row:nth-child(1) .exp__inline-preview img', placeholder: '.exp__row:nth-child(1) .exp__inline-placeholder' },
    { key: 'dining', selector: '#exp-preview .exp__preview-img[data-idx="0"] img', placeholder: '#exp-preview .exp__preview-img[data-idx="0"] .exp__preview-placeholder' },
    { key: 'spa', selector: '.exp__row:nth-child(2) .exp__inline-preview img', placeholder: '.exp__row:nth-child(2) .exp__inline-placeholder' },
    { key: 'spa', selector: '#exp-preview .exp__preview-img[data-idx="1"] img', placeholder: '#exp-preview .exp__preview-img[data-idx="1"] .exp__preview-placeholder' },
    { key: 'pool', selector: '.exp__row:nth-child(3) .exp__inline-preview img', placeholder: '.exp__row:nth-child(3) .exp__inline-placeholder' },
    { key: 'pool', selector: '#exp-preview .exp__preview-img[data-idx="2"] img', placeholder: '#exp-preview .exp__preview-img[data-idx="2"] .exp__preview-placeholder' },
    { key: 'courtyard', selector: '.exp__row:nth-child(4) .exp__inline-preview img', placeholder: '.exp__row:nth-child(4) .exp__inline-placeholder' },
    { key: 'courtyard', selector: '#exp-preview .exp__preview-img[data-idx="3"] img', placeholder: '#exp-preview .exp__preview-img[data-idx="3"] .exp__preview-placeholder' },
  ];

  targets.forEach(({ key, selector, placeholder }) => {
    const el = document.querySelector(selector);
    const ph = placeholder ? document.querySelector(placeholder) : null;
    const url = getImage(key);

    if (el) {
      if (url) {
        el.src = url;
        el.style.display = 'block';
        el.style.opacity = '1';
        el.style.clipPath = 'inset(0)';
        if (ph) ph.style.display = 'none';
      } else {
        el.style.display = 'none';
        if (ph) {
          ph.style.display = 'flex';
          ph.style.opacity = '1';
          ph.style.clipPath = 'inset(0)';
        }
      }
    }
  });

  // Also general scan of all <img> in DOM
  document.querySelectorAll('img').forEach((img) => {
    const srcAttr = img.getAttribute('src') || '';
    const match = srcAttr.match(/\/([^\/]+)\.[a-zA-Z0-9]+$/);
    if (match) {
      const name = match[1];
      const url = getImage(name);
      const ph = img.nextElementSibling;
      if (url) {
        img.src = url;
        img.style.display = 'block';
        img.style.opacity = '1';
        img.style.clipPath = 'inset(0)';
        if (ph && (ph.classList.contains('hero__img-placeholder') ||
                   ph.classList.contains('hero__placeholder') ||
                   ph.classList.contains('story__arch-placeholder') ||
                   ph.classList.contains('suites__img-placeholder') ||
                   ph.classList.contains('story__img-block-placeholder') ||
                   ph.classList.contains('exp__inline-placeholder') ||
                   ph.classList.contains('exp__preview-placeholder') ||
                   ph.classList.contains('suites__mobile-img-placeholder') ||
                   ph.classList.contains('thumb-placeholder') ||
                   ph.classList.contains('suite-card__thumb-placeholder'))) {
          ph.style.display = 'none';
        }
      } else {
        // Truly no match: keep warm placeholder
        img.style.display = 'none';
        if (ph && (ph.classList.contains('hero__img-placeholder') ||
                   ph.classList.contains('hero__placeholder') ||
                   ph.classList.contains('story__arch-placeholder') ||
                   ph.classList.contains('suites__img-placeholder') ||
                   ph.classList.contains('story__img-block-placeholder') ||
                   ph.classList.contains('exp__inline-placeholder') ||
                   ph.classList.contains('exp__preview-placeholder') ||
                   ph.classList.contains('suites__mobile-img-placeholder') ||
                   ph.classList.contains('thumb-placeholder') ||
                   ph.classList.contains('suite-card__thumb-placeholder'))) {
          ph.style.display = 'flex';
          ph.style.opacity = '1';
          ph.style.clipPath = 'inset(0)';
        }
      }
    }
  });

  // CSS background application for any element with data-bg or classes
  document.querySelectorAll('[data-bg]').forEach(el => {
    const key = el.dataset.bg;
    const url = getImage(key);
    if (url) {
      el.style.backgroundImage = `url("${url}")`;
    }
  });

  // Update thumbnail buttons data-src / img in bottom bar
  const thumbCourtyard = document.querySelector('button[title="Courtyard"]');
  if (thumbCourtyard) {
    const url = getImage('courtyard');
    if (url) {
      thumbCourtyard.dataset.src = url;
      const img = thumbCourtyard.querySelector('img');
      if (img) { img.src = url; img.style.display = 'block'; img.style.opacity = '1'; }
      const ph = thumbCourtyard.querySelector('.thumb-placeholder');
      if (ph) ph.style.display = 'none';
    }
  }

  const thumbPool = document.querySelector('button[title="Pool"]');
  if (thumbPool) {
    const url = getImage('pool');
    if (url) {
      thumbPool.dataset.src = url;
      const img = thumbPool.querySelector('img');
      if (img) { img.src = url; img.style.display = 'block'; img.style.opacity = '1'; }
      const ph = thumbPool.querySelector('.thumb-placeholder');
      if (ph) ph.style.display = 'none';
    } else {
      const img = thumbPool.querySelector('img');
      if (img) img.style.display = 'none';
      const ph = thumbPool.querySelector('.thumb-placeholder');
      if (ph) ph.style.display = 'flex';
    }
  }
}

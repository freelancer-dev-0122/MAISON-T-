/**
 * MAISON ÉTÉ · Odometer Digit Counter
 * Animates numeric text with rolling digit columns
 * Each digit slot scrolls through 0–9 like a mechanical odometer
 */
import { gsap } from 'gsap';

/**
 * Animates an element as an odometer counter
 * @param {HTMLElement} el — element containing raw number text
 * @param {object} options
 */
export function initOdometer(el, options = {}) {
  const {
    duration = 1.6,
    delay    = 0,
    ease     = 'power3.out',
    suffix   = '',
  } = options;

  const rawVal = el.dataset.val ?? el.dataset.value ?? el.textContent.trim();
  const cleanVal = String(rawVal).replace(/[^0-9.]/g, '');
  const target = parseFloat(cleanVal);
  if (isNaN(target)) return;

  // Always remember the final target value
  el.dataset.val = cleanVal;

  const isDecimal = cleanVal.includes('.');
  const decimals  = isDecimal ? cleanVal.split('.')[1].length : 0;
  const formatted = formatNumber(target, decimals);
  const chars = formatted.split('');

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Build digit columns
  el.textContent = '';
  el.style.display = 'inline-flex';
  el.style.alignItems = 'baseline';

  const columns = [];

  chars.forEach((ch) => {
    if (ch === '.' || ch === ',') {
      const sep = document.createElement('span');
      sep.textContent = ch;
      sep.style.alignSelf = 'flex-end';
      sep.style.lineHeight = '1';
      el.appendChild(sep);
      return;
    }

    const d = parseInt(ch, 10);
    if (isNaN(d)) {
      const span = document.createElement('span');
      span.textContent = ch;
      el.appendChild(span);
      return;
    }

    const col = createDigitColumn(d);
    el.appendChild(col.wrapper);
    columns.push({ el: col.inner, digit: d });
  });

  if (suffix) {
    const sfx = document.createElement('span');
    sfx.textContent = suffix;
    sfx.style.fontSize = '0.55em';
    sfx.style.alignSelf = 'flex-end';
    sfx.style.marginBottom = '0.1em';
    sfx.style.marginLeft = '0.15em';
    sfx.style.letterSpacing = '0.06em';
    el.appendChild(sfx);
  }

  // Animate each column
  columns.forEach(({ el: inner, digit }) => {
    const totalDigits = 10; // 0–9
    const targetPos = (digit / totalDigits) * -100;

    if (isReduced) {
      inner.style.transform = `translateY(${targetPos}%)`;
      return;
    }

    gsap.fromTo(inner,
      { y: '0%' },
      {
        y: `${targetPos}%`,
        duration,
        delay,
        ease,
        overwrite: 'auto',
        onComplete: () => {
          gsap.set(inner, { y: `${targetPos}%` });
        }
      }
    );
  });
}

function createDigitColumn(targetDigit) {
  const wrapper = document.createElement('span');
  wrapper.className = 'odometer-digit';
  wrapper.style.cssText = `
    display: inline-flex;
    flex-direction: column;
    height: 1em;
    overflow: hidden;
    line-height: 1;
    vertical-align: top;
  `;

  const inner = document.createElement('span');
  inner.className = 'odometer-digit__inner';
  inner.style.cssText = `
    display: flex;
    flex-direction: column;
    will-change: transform;
  `;

  // Build 0–9 then repeat target at bottom for smooth ending
  for (let d = 0; d <= 9; d++) {
    const span = document.createElement('span');
    span.textContent = d;
    span.style.lineHeight = '1';
    inner.appendChild(span);
  }

  wrapper.appendChild(inner);
  return { wrapper, inner };
}

function formatNumber(n, decimals) {
  return n.toFixed(decimals);
}

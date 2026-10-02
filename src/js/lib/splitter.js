/**
 * MAISON ÉTÉ · Text Splitter
 * Splits text into chars/words/lines preserving spaces
 * Wraps each unit in a .char/.word/.line span
 */

export function splitChars(el) {
  const text = el.textContent;
  el.innerHTML = '';
  el.style.opacity = '1';

  const chars = [];
  for (const ch of text) {
    if (ch === ' ') {
      el.insertAdjacentHTML('beforeend', '<span class="char-space">&nbsp;</span>');
    } else {
      const wrap = document.createElement('span');
      wrap.className = 'char-wrap clip-wrap';
      wrap.style.display = 'inline-block';
      wrap.style.overflow = 'hidden';
      wrap.style.verticalAlign = 'bottom';
      wrap.style.lineHeight = '1.08';
      wrap.style.paddingBottom = '0.14em';
      wrap.style.marginBottom = '-0.14em';

      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      span.style.display = 'inline-block';

      wrap.appendChild(span);
      el.appendChild(wrap);
      chars.push(span);
    }
  }
  return chars;
}

export function splitWords(el) {
  const text = el.textContent;
  const words = text.split(' ');
  el.innerHTML = '';
  el.style.opacity = '1';

  const wordEls = [];
  words.forEach((word, i) => {
    const wrap = document.createElement('span');
    wrap.className = 'word-wrap clip-wrap';
    wrap.style.display = 'inline-block';
    wrap.style.overflow = 'hidden';
    wrap.style.verticalAlign = 'bottom';
    wrap.style.lineHeight = '1.08';
    wrap.style.paddingBottom = '0.14em';
    wrap.style.marginBottom = '-0.14em';

    const inner = document.createElement('span');
    inner.className = 'word';
    inner.textContent = word;
    inner.style.display = 'inline-block';

    wrap.appendChild(inner);
    el.appendChild(wrap);
    wordEls.push(inner);

    if (i < words.length - 1) {
      el.insertAdjacentHTML('beforeend', ' ');
    }
  });

  return wordEls;
}

/**
 * Mask reveal animation — animates words up from translateY(100%)
 * @param {HTMLElement[]} words
 * @param {gsap} gsap
 * @param {object} options
 */
export function revealWords(words, gsap, options = {}) {
  const {
    duration = 0.9,
    stagger  = 0.06,
    delay    = 0,
    ease     = 'power3.out',
    from     = { y: '105%' },
    to       = { y: '0%' },
    ...rest
  } = options;

  return gsap.fromTo(words, from, {
    ...to,
    duration,
    stagger,
    delay,
    ease,
    ...rest,
  });
}

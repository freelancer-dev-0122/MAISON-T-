/**
 * MAISON ÉTÉ · Hero Section
 * - hero.jpg full-bleed slow scale 1.12 → 1
 * - Mouse parallax (quickTo, max 14px)
 * - Giant title fitted to viewport width, chars rise with stagger
 * - Corner labels fade in
 * - Tagline fade in
 * - Image swap with clip-path wipe on thumbnail click
 */
import { gsap } from 'gsap';
import { splitChars } from '../lib/splitter.js';

export async function initHero() {
  const hero      = document.getElementById('hero');
  const imgEl     = hero?.querySelector('.hero__img');
  const titleEl   = hero?.querySelector('.hero__title');
  const taglineEl = hero?.querySelector('.hero__tagline');
  const labelTL   = hero?.querySelector('.hero__label-tl');
  const labelBR   = hero?.querySelector('.hero__label-br');

  if (!hero) return null;

  // ── Fit title to width ──────────────────────
  fitTitle(titleEl, hero);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => fitTitle(titleEl, hero), 120);
  });

  // ── Mouse parallax ──────────────────────────
  if (!window.matchMedia('(hover: none)').matches && imgEl) {
    const setParX = gsap.quickTo(imgEl, 'x', { duration: 0.9, ease: 'power2.out' });
    const setParY = gsap.quickTo(imgEl, 'y', { duration: 0.9, ease: 'power2.out' });

    window.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      setParX((e.clientX - cx) / cx * 14);
      setParY((e.clientY - cy) / cy * 14);
    });
  }

  // Pre-set labels below to animate from
  gsap.set([labelTL, labelBR, taglineEl], { opacity: 0, y: 12 });

  return {
    animateIn() {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Reveal hero
      gsap.to(hero, { opacity: 1, duration: 0.5, ease: 'power2.out' });

      // Image: scale 1.12 → 1
      if (imgEl) {
        imgEl.style.opacity = '1';
        imgEl.style.clipPath = 'inset(0)';
        gsap.to(imgEl, {
          scale: 1,
          duration: reduced ? 0.01 : 2.4,
          ease: 'power3.out',
          onComplete() {
            imgEl.style.opacity = '1';
            imgEl.style.clipPath = 'inset(0)';
          }
        });
      }

      // Title chars rise in
      if (titleEl) {
        if (!reduced) {
          const chars = splitChars(titleEl);
          titleEl.style.opacity = '1';
          gsap.fromTo(chars,
            { y: '110%' },
            {
              y: '0%',
              duration: 1.1,
              stagger: 0.032,
              ease: 'power3.out',
              delay: 0.25,
            }
          );
        } else {
          titleEl.style.opacity = '1';
        }
      }

      // Labels + tagline
      gsap.to([labelTL, labelBR, taglineEl], {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.85,
      });
    }
  };
}

/**
 * Fit title font-size so the text fills the hero width minus margins
 */
function fitTitle(el, hero) {
  if (!el || !hero) return;

  const maxW = hero.offsetWidth - 64;  // 32px each side
  const maxH = hero.offsetHeight * 0.55;

  el.style.whiteSpace   = 'nowrap';
  el.style.fontSize     = '10px';
  el.style.visibility   = 'hidden';

  // Binary search
  let lo = 16, hi = 500;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = mid + 'px';
    if (el.scrollWidth <= maxW && el.offsetHeight <= maxH) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  el.style.fontSize   = lo + 'px';
  el.style.visibility = '';
}

/**
 * Swap hero image with clip-path wipe
 * Called from bottom bar thumbnails
 */
export function swapHeroImage(newSrc) {
  const hero    = document.getElementById('hero');
  const imgEl   = hero?.querySelector('.hero__img');
  const overlay = hero?.querySelector('.hero__swap-overlay');
  if (!imgEl || !overlay) return;

  const tl = gsap.timeline();
  // 1. Overlay sweeps in from left (covers the image)
  tl.fromTo(overlay,
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', duration: 0.45, ease: 'power3.inOut' }
  )
  // 2. Swap the image source while hidden
  .call(() => {
    imgEl.style.display = '';
    const ph = hero?.querySelector('.hero__placeholder');
    if (ph) ph.style.display = 'none';
    imgEl.src = newSrc;
  })
  // 3. Short pause
  .to({}, { duration: 0.1 })
  // 4. Overlay sweeps away to the right
  .to(overlay, {
    clipPath: 'inset(0 0 0 100%)',
    duration: 0.55,
    ease: 'power3.inOut',
  });
}

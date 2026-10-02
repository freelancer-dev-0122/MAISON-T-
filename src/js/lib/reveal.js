/**
 * MAISON ÉTÉ · Image Reveal Helper
 * clip-path inset reveal + scale 1.2 → 1
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * @param {HTMLElement} imgEl    — the <img> or image wrapper
 * @param {object}      options
 */
export function revealImage(imgEl, options = {}) {
  const {
    duration = 1.2,
    delay    = 0,
    ease     = 'power3.inOut',
    trigger  = imgEl,
    start    = 'top 80%',
  } = options;

  // Visible by default if trigger does not fire
  imgEl.style.opacity = '1';
  imgEl.style.clipPath = 'inset(0)';

  if (prefersReducedMotion()) {
    return;
  }

  ScrollTrigger.create({
    trigger,
    start,
    once: true,
    onEnter: () => {
      gsap.fromTo(imgEl,
        { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0.8, scale: 1.2 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          scale: 1,
          opacity: 1,
          duration,
          delay,
          ease,
          onComplete: () => {
            imgEl.style.opacity = '1';
            imgEl.style.clipPath = 'inset(0)';
          }
        }
      );
    },
  });
}

/**
 * DPR cap — returns devicePixelRatio clamped to max 2
 */
export function getDPR(max = 2) {
  return Math.min(window.devicePixelRatio || 1, max);
}

/**
 * Prefers reduced motion check
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

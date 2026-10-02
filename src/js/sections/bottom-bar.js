/**
 * MAISON ÉTÉ · Bottom Bar Section
 * - Stat odometers animate in after loader exits
 * - Thumbnail buttons swap hero image
 * - Bar fades in
 */
import { gsap } from 'gsap';
import { initOdometer } from '../lib/odometer.js';
import { swapHeroImage } from './hero.js';

export function initBottomBar() {
  const bar    = document.getElementById('bottom-bar');
  const thumbs = document.querySelectorAll('.thumb-btn');
  const stats  = document.querySelectorAll('.stat__value');

  if (!bar) return;

  // ── Thumbnail image swap ──────────────────────
  thumbs.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('is-active'));
      btn.classList.add('is-active');

      const img = btn.querySelector('img');
      const src = (img && img.naturalWidth > 0 && img.src) ? img.src : btn.dataset.src;
      if (src) {
        swapHeroImage(src);
      }
    });
  });

  // Mark first thumb as active by default
  thumbs[0]?.classList.add('is-active');

  return {
    animateIn() {
      // Fade in bar
      gsap.to(bar, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.2 });

      // Odometer for each stat value
      stats.forEach((stat, i) => {
        initOdometer(stat, {
          duration: 1.8,
          delay: 0.4 + i * 0.15,
          ease: 'power3.out',
        });
      });
    }
  };
}

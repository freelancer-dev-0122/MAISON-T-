/**
 * MAISON ÉTÉ · Marquee Section
 *
 * SECTION B: MARQUEE (cream background, two stacked rows, padding 80px top/bottom)
 * - Row 1 scrolls left: huge filled olive Fraunces light italic words
 *   "Slow mornings • Long lunches • Golden hours • Quiet nights •"
 * - Row 2 scrolls right: 1px olive outlined text with terracotta bullets
 * - Speed follows scroll velocity (Lenis velocity)
 * - Skew up to 5deg when scrolling fast, easing back when still
 * - Pause on hover, pause when offscreen
 * - No horizontal page overflow
 */
import { createMarquee } from '../lib/marquee.js';

export function initMarquee(lenis) {
  const section = document.getElementById('marquee-section');
  if (!section) return;

  const row1 = section.querySelector('.marquee__row--1');
  const row2 = section.querySelector('.marquee__row--2');

  // Row 1: scrolls left, filled olive
  if (row1) {
    createMarquee(row1, {
      direction: 'left',
      speed: 1.2,
      lenis,
      maxSkew: 5,
    });
  }

  // Row 2: scrolls right, outlined olive
  if (row2) {
    createMarquee(row2, {
      direction: 'right',
      speed: 1.2,
      lenis,
      maxSkew: 5,
    });
  }
}

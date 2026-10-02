/**
 * MAISON ÉTÉ · Magnetic Button
 * Elements attract the cursor within a radius
 */
import { gsap } from 'gsap';

/**
 * @param {HTMLElement} el — the button element
 * @param {object} options
 */
export function initMagnetic(el, options = {}) {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const {
    strength = 0.35,
    radius   = 80,
    ease     = 'power2.out',
    duration = 0.4,
  } = options;

  let bounds;

  function onMouseMove(e) {
    if (!bounds) bounds = el.getBoundingClientRect();

    const cx = bounds.left + bounds.width  / 2;
    const cy = bounds.top  + bounds.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < radius) {
      gsap.to(el, {
        x: dx * strength,
        y: dy * strength,
        duration,
        ease,
      });
    }
  }

  function onMouseLeave() {
    bounds = null;
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.6)' });
  }

  function onMouseEnter() {
    bounds = el.getBoundingClientRect();
  }

  el.addEventListener('mouseenter', onMouseEnter);
  el.addEventListener('mousemove',  onMouseMove);
  el.addEventListener('mouseleave', onMouseLeave);

  // Cleanup function
  el._magneticCleanup = () => {
    el.removeEventListener('mouseenter', onMouseEnter);
    el.removeEventListener('mousemove',  onMouseMove);
    el.removeEventListener('mouseleave', onMouseLeave);
  };
}

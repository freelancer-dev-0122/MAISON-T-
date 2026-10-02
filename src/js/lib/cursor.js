/**
 * MAISON ÉTÉ · Custom Cursor
 * dot + ring, mix-blend-mode: difference
 * label pill: VIEW / DRAG / BOOK
 * disabled on touch devices
 */
import { gsap } from 'gsap';

let isTouch = false;

export function initCursor() {
  // Detect touch — skip cursor on touch-only devices
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    isTouch = true;
    return;
  }

  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  const dot  = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const label = cursor.querySelector('.cursor__label');

  let mouseX = window.innerWidth  / 2;
  let mouseY = window.innerHeight / 2;
  let dotX   = mouseX;
  let dotY   = mouseY;
  let ringX  = mouseX;
  let ringY  = mouseY;

  // QuickTo setters for performance
  const setDotX  = gsap.quickTo(dot,  'x', { duration: 0.06, ease: 'none' });
  const setDotY  = gsap.quickTo(dot,  'y', { duration: 0.06, ease: 'none' });
  const setRingX = gsap.quickTo(ring, 'x', { duration: 0.18, ease: 'power2.out' });
  const setRingY = gsap.quickTo(ring, 'y', { duration: 0.18, ease: 'power2.out' });
  const setLabelX = gsap.quickTo(label, 'x', { duration: 0.18, ease: 'power2.out' });
  const setLabelY = gsap.quickTo(label, 'y', { duration: 0.18, ease: 'power2.out' });

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    setDotX(mouseX);
    setDotY(mouseY);
    setRingX(mouseX);
    setRingY(mouseY);
    setLabelX(mouseX);
    setLabelY(mouseY);
    cursor.classList.remove('cursor--hidden');
  });

  // Hide when leaving window
  document.addEventListener('mouseleave', () => cursor.classList.add('cursor--hidden'));
  document.addEventListener('mouseenter', () => cursor.classList.remove('cursor--hidden'));

  // Expanded state on interactive elements
  const hoverTargets = '[data-cursor], a, button, .thumb-btn, input, select';

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest(hoverTargets);
    if (!el) return;

    const cursorType = el.dataset.cursor || 'hover';
    cursor.classList.add('cursor--expanded');

    if (cursorType === 'view')  { showLabel('VIEW'); }
    else if (cursorType === 'drag') { showLabel('DRAG'); cursor.classList.add('cursor--drag'); }
    else if (cursorType === 'book') { showLabel('BOOK'); }
    else { label.style.opacity = '0'; cursor.classList.remove('cursor--labeled'); }
  });

  document.addEventListener('mouseout', (e) => {
    const el = e.target.closest(hoverTargets);
    if (!el) return;
    cursor.classList.remove('cursor--expanded', 'cursor--labeled', 'cursor--drag');
    label.style.opacity = '0';
  });

  function showLabel(text) {
    label.textContent = text;
    cursor.classList.add('cursor--labeled');
  }
}

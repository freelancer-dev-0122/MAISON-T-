/**
 * MAISON ÉTÉ · Experiences Section
 *
 * SECTION A: EXPERIENCES (normal flow, olive bg #2F3A2A, cream text)
 * - Words reveal headline: "Days without a schedule."
 * - Stagger reveal for 4 rows
 * - Desktop hover:
 *   - Floating preview (320x420, arch-topped) follows cursor with quickTo (x, y, 0.5s, power3.out)
 *   - Rotates with horizontal cursor velocity (max 6deg)
 *   - Fades & scales in on row enter (clip-path inset reveal), out on leave
 *   - Row shifts 24px right, other rows drop to 35% opacity, arrow rotates 45deg & terracotta
 *   - Cursor ring is hidden while preview is active
 *   - Pointer-events: none, created once & reused, NO layout reads in mousemove
 * - Mobile / Touch:
 *   - No floating preview
 *   - Tap-to-expand accordion inline image (height animated with GSAP, one row open at a time)
 * - Centered terracotta pill "See all experiences ↗" with magnetic hover and "VIEW" cursor label
 */
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initMagnetic }  from '../lib/magnetic.js';

const isMobile  = () => window.innerWidth <= 900 || window.matchMedia('(hover: none)').matches;
const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initExperiences() {
  const section = document.getElementById('experiences');
  if (!section) return;

  // Initialize magnetic CTA button (desktop with fine pointer only)
  if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    section.querySelectorAll('[data-magnetic]').forEach(el => initMagnetic(el));
  }

  // Word reveal headline
  buildHeadline(section);

  // Stagger reveal rows
  buildRowsReveal(section);

  // MatchMedia for Desktop hover preview vs Mobile/Touch accordion
  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px) and (hover: hover) and (pointer: fine)', () => {
    if (!isReduced()) {
      initDesktopHover(section);
    }
  });

  mm.add('(max-width: 900px), (hover: none), (pointer: coarse)', () => {
    initMobileAccordion(section);
  });

  // Schedule refresh after fonts & images
  scheduleRefresh(section);
}

/* ─────────────────────────────────────────────
   Headline word reveal
   ───────────────────────────────────────────── */
function buildHeadline(section) {
  const headline = section.querySelector('.exp__headline');
  if (!headline || isReduced()) return;

  headline.innerHTML = `
    <span class="word-wrap"><span class="word">Days</span></span>
    <span class="word-wrap"><span class="word">without</span></span>
    <span class="word-wrap"><span class="word">a</span></span>
    <span class="word-wrap"><span class="word word--accent">schedule.</span></span>
  `;

  const words = headline.querySelectorAll('.word');
  gsap.set(words, { y: '110%' });

  ScrollTrigger.create({
    trigger: headline,
    start:   'top 85%',
    once:    true,
    invalidateOnRefresh: true,
    onEnter() {
      gsap.to(words, {
        y: '0%',
        duration: 0.95,
        stagger: 0.08,
        ease: 'power3.out',
      });
    },
  });
}

/* ─────────────────────────────────────────────
   Staggered rows reveal on scroll
   ───────────────────────────────────────────── */
function buildRowsReveal(section) {
  const rows = section.querySelectorAll('.exp__row');
  if (!rows.length || isReduced()) return;

  gsap.set(rows, { y: 40, opacity: 0 });

  ScrollTrigger.create({
    trigger: section.querySelector('.exp__list'),
    start:   'top 80%',
    once:    true,
    invalidateOnRefresh: true,
    onEnter() {
      gsap.to(rows, {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out',
      });
    },
  });
}

/* ─────────────────────────────────────────────
   Desktop floating preview with quickTo
   No layout reads in mousemove!
   ───────────────────────────────────────────── */
function initDesktopHover(section) {
  const preview = document.getElementById('exp-preview');
  const rows    = [...section.querySelectorAll('.exp__row')];
  const list    = section.querySelector('.exp__list');
  const cursor  = document.getElementById('cursor');

  if (!preview || !rows.length || !list) return;

  const previewImgs = [...preview.querySelectorAll('.exp__preview-img')];

  // Quick setters for smooth follow and tilt
  const setX   = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
  const setY   = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
  const setRot = gsap.quickTo(preview, 'rotation', { duration: 0.35, ease: 'power2.out' });

  let lastClientX = 0;
  let isHoveringList = false;

  // Track cursor position inside section with zero layout reads
  section.addEventListener('mousemove', (e) => {
    // Velocity calculation for rotation (max 6deg)
    const vx = e.clientX - lastClientX;
    lastClientX = e.clientX;

    const rot = Math.max(-6, Math.min(6, vx * 0.45));
    setRot(rot);

    // Center preview at cursor (preview is 320x420)
    setX(e.clientX - 160);
    setY(e.clientY - 210);
  });

  // Row enter / leave listeners
  rows.forEach((row, idx) => {
    row.addEventListener('mouseenter', () => {
      isHoveringList = true;

      // 1. Switch active image inside reused preview
      previewImgs.forEach((img, i) => {
        img.classList.toggle('is-active', i === idx);
      });

      // 2. Reveal preview: clip-path inset reveal + opacity + scale
      gsap.to(preview, {
        opacity: 1,
        scale: 1,
        clipPath: 'inset(0% 0 0% 0 round 999px 999px 0 0)',
        duration: 0.45,
        ease: 'power3.out',
        overwrite: 'auto',
      });

      // 3. Hide cursor ring while preview is active
      cursor?.classList.add('cursor--hidden');
    });
  });

  list.addEventListener('mouseleave', () => {
    isHoveringList = false;

    // Hide preview
    gsap.to(preview, {
      opacity: 0,
      scale: 0.85,
      clipPath: 'inset(100% 0 0% 0 round 999px 999px 0 0)',
      duration: 0.35,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete() {
        setRot(0);
      }
    });

    // Restore cursor
    cursor?.classList.remove('cursor--hidden');
  });
}

/* ─────────────────────────────────────────────
   Mobile tap-to-expand accordion
   One row open at a time
   ───────────────────────────────────────────── */
function initMobileAccordion(section) {
  const rows = section.querySelectorAll('.exp__row');

  rows.forEach((row) => {
    const inline = row.querySelector('.exp__inline-preview');
    if (!inline) return;

    row.addEventListener('click', (e) => {
      // Prevent default link jump
      e.preventDefault();

      const isOpen = row.classList.contains('is-open');

      // Close all other rows
      rows.forEach((otherRow) => {
        if (otherRow !== row) {
          otherRow.classList.remove('is-open');
          const otherInline = otherRow.querySelector('.exp__inline-preview');
          if (otherInline) {
            gsap.to(otherInline, { height: 0, duration: 0.4, ease: 'power2.inOut' });
          }
        }
      });

      // Toggle clicked row
      if (isOpen) {
        row.classList.remove('is-open');
        gsap.to(inline, { height: 0, duration: 0.4, ease: 'power2.inOut' });
      } else {
        row.classList.add('is-open');
        gsap.set(inline, { height: 'auto' });
        gsap.from(inline, { height: 0, duration: 0.45, ease: 'power2.out' });
      }
    });
  });
}

/* ─────────────────────────────────────────────
   ScrollTrigger refresh helper
   ───────────────────────────────────────────── */
function scheduleRefresh(section) {
  ScrollTrigger.refresh();

  const imgs = section.querySelectorAll('img');
  let loaded = 0;
  const total = imgs.length || 1;

  const tryRefresh = () => {
    if (++loaded >= total) ScrollTrigger.refresh();
  };

  imgs.forEach((img) => {
    if (img.complete) tryRefresh();
    else {
      img.addEventListener('load',  tryRefresh, { once: true });
      img.addEventListener('error', tryRefresh, { once: true });
    }
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

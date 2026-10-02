/**
 * MAISON ÉTÉ · Main Entry Point
 * Scroll engine: ONE Lenis instance driven by gsap ticker
 */
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis             from 'lenis';

import { initCursor }    from './js/lib/cursor.js';
import { initMagnetic }  from './js/lib/magnetic.js';
import { initMobileNav } from './js/lib/mobile-nav.js';
import { initLoader }    from './js/sections/loader.js';
import { initHero }      from './js/sections/hero.js';
import { initBottomBar } from './js/sections/bottom-bar.js';
import { initStory }       from './js/sections/story.js';
import { initSuites }      from './js/sections/suites.js';
import { initExperiences } from './js/sections/experiences.js';
import { initMarquee }     from './js/sections/marquee.js';
import { initReserve }     from './js/sections/reserve.js';
import { initFooter }      from './js/sections/footer.js';
import { initAllImages }   from './js/lib/assets.js';

import './styles/tokens.css';
import './styles/base.css';
import './styles/loader.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/bottom-bar.css';
import './styles/cursor.css';
import './styles/story.css';
import './styles/suites.css';
import './styles/experiences.css';
import './styles/marquee.css';
import './styles/reserve.css';
import './styles/footer.css';

// ── GSAP Plugin Registration ──────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── Scroll Engine: ONE Lenis instance ────────────
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
});

// Lenis → ScrollTrigger sync
lenis.on('scroll', ScrollTrigger.update);

// GSAP ticker drives Lenis (single source of truth)
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ── Init Cursor (desktop fine pointer only) ─────────
initCursor();

// ── Magnetic buttons ──────────────────────────────
if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) {
  document.querySelectorAll('[data-magnetic]').forEach(el => initMagnetic(el));
}

// ── Mobile Navigation ─────────────────────────────
initMobileNav(lenis);

// ── Global Smooth Anchor Scrolling with 96px offset ──
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href === '#main-content') return;
    const targetSelector = href === '#rooms' ? '#suites' : href;
    const target = document.querySelector(targetSelector);
    if (target && lenis) {
      e.preventDefault();
      // Ensure scroll lock is cleared
      document.body.style.overflow = '';
      lenis.start();
      lenis.scrollTo(target, {
        offset: -96,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    }
  });
});

// ── Debounced Resize Refresh ───────────────────────
let resizeDebounce = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeDebounce);
  resizeDebounce = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 200);
});

// ── Init Sections (before loader exits) ──────────
let heroSection     = null;
let bottomBarSection = null;

async function boot() {
  initAllImages();
  heroSection      = await initHero();
  bottomBarSection = initBottomBar();

  // ── Loader ─────────────────────────────────────
  initLoader(lenis, onLoaderComplete);
}

function onLoaderComplete() {
  // Nav fade in
  const nav = document.getElementById('nav');
  if (nav) {
    gsap.to(nav, { opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.1 });
  }

  // Hero and bar animate in
  heroSection?.animateIn();
  bottomBarSection?.animateIn();

  // Story section — init after loader so layout is settled
  initStory();

  // Suites section — receives lenis for tick scroll-to
  initSuites(lenis);

  // Experiences section (normal flow)
  initExperiences();

  // Marquee section (normal flow, two stacked rows)
  initMarquee(lenis);

  // Reserve section (normal flow, 3-step booking widget)
  initReserve(lenis);

  // Footer section (normal flow)
  initFooter(lenis);

  // Refresh ScrollTrigger after loader exits, fonts ready, and images loaded
  const refreshST = () => ScrollTrigger.refresh();
  document.fonts.ready.then(refreshST);
  window.addEventListener('load', refreshST);

  // Ensure every image load triggers a refresh
  let loadedCount = 0;
  const imgs = document.querySelectorAll('img');
  const onImgLoadOrError = () => {
    loadedCount++;
    if (loadedCount >= imgs.length) {
      ScrollTrigger.refresh();
    }
  };
  imgs.forEach(img => {
    if (img.complete) {
      onImgLoadOrError();
    } else {
      img.addEventListener('load', onImgLoadOrError, { once: true });
      img.addEventListener('error', onImgLoadOrError, { once: true });
    }
  });

  // ── Nav Theme Awareness (Experiences & Footer) ──
  const darkSections = ['#experiences', '#site-footer'];
  const updateNavTheme = () => {
    if (!nav) return;
    const isOverDark = darkSections.some(sel => {
      const sec = document.querySelector(sel);
      if (!sec) return false;
      const rect = sec.getBoundingClientRect();
      return rect.top <= 50 && rect.bottom >= 50;
    });
    nav.classList.toggle('nav--theme-dark', isOverDark);
  };

  darkSections.forEach(sel => {
    const sec = document.querySelector(sel);
    if (sec && nav) {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 50px',
        end: 'bottom 50px',
        onEnter:     updateNavTheme,
        onLeave:     updateNavTheme,
        onEnterBack: updateNavTheme,
        onLeaveBack: updateNavTheme,
        onRefresh:   updateNavTheme,
      });
    }
  });

  lenis.on('scroll', updateNavTheme);
}

boot();

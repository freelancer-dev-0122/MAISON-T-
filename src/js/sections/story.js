/**
 * MAISON ÉTÉ · The Story Section
 *
 * PART A — Pinned arch reveal (~300vh scroll space)
 *   One GSAP timeline, scrub:1
 *   clip-path arch → full viewport
 *   Image scale 1.35 → 1
 *   Background words drift apart + fade
 *   Caption char-reveal at 70%
 *
 * PART B — Editorial story (normal flow)
 *   Scroll-scrubbed word opacity
 *   Image clip-path wipe + parallax scale
 *   Odometer stats on viewport enter
 *   Magnetic rotating-ring CTA
 *
 * Scroll rules:
 *   - Uses existing ScrollTrigger (registered in main.js)
 *   - Pin via scrollerProxy not needed — Lenis + gsap.ticker already synced
 *   - pinSpacing:true, anticipatePin:1, invalidateOnRefresh:true on ALL triggers
 *   - No overflow:hidden / transform on pin ancestors (#story, .story__pin-track)
 */
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitChars, splitWords } from '../lib/splitter.js';
import { initOdometer }           from '../lib/odometer.js';
import { initMagnetic }           from '../lib/magnetic.js';

const isMobile  = () => window.innerWidth <= 900;
const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────────
   Main export
   ───────────────────────────────────────────── */
export function initStory() {
  const section = document.getElementById('story');
  if (!section) return;

  buildPartA(section);
  buildPartB(section);

  // Refresh on image load, font load, and once after mount
  const imgs = section.querySelectorAll('img');
  let loaded = 0;
  const total = imgs.length || 1;
  const tryRefresh = () => { if (++loaded >= total) ScrollTrigger.refresh(); };
  imgs.forEach(img => {
    if (img.complete) tryRefresh();
    else { img.addEventListener('load', tryRefresh, { once: true }); img.addEventListener('error', tryRefresh, { once: true }); }
  });
  if (!imgs.length) ScrollTrigger.refresh();

  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/* ═════════════════════════════════════════════
   PART A — Pinned arch reveal
   ═════════════════════════════════════════════ */
function buildPartA(section) {
  const track   = section.querySelector('.story__pin-track');
  const scene   = section.querySelector('.story__pin-scene');
  const archWrap  = section.querySelector('.story__arch-wrap');
  const archImg   = section.querySelector('.story__arch-img');
  const scrim     = section.querySelector('.story__arch-scrim');
  const caption   = section.querySelector('.story__arch-caption');
  const captionTxt= section.querySelector('.story__arch-caption-text');
  const wordLeft  = section.querySelector('.story__bg-word--left');
  const wordRight = section.querySelector('.story__bg-word--right');
  const labels    = section.querySelectorAll('.story__arch-label');

  if (!track || !scene || !archWrap) return;

  // ── Reduced motion: skip all animation, show full scene
  if (isReduced()) {
    archWrap.style.clipPath = 'inset(0% 0% 0% 0% round 0)';
    if (archImg) archImg.style.transform = 'scale(1)';
    if (scrim)   scrim.style.opacity = '1';
    if (caption) caption.style.opacity = '1';
    if (captionTxt) captionTxt.style.opacity = '1';
    [wordLeft, wordRight].forEach(w => w && (w.style.opacity = '0'));
    labels.forEach(l => l.style.opacity = '0');
    return;
  }

  // ── Set pin track height responsively
  function setTrackHeight() {
    track.style.height = isMobile() ? '220vh' : '300vh';
  }
  setTrackHeight();

  // ── Starting arch clip-path values (set on DOM directly)
  const archStart = isMobile()
    ? 'inset(14% 12% 14% 12% round 999px 999px 0 0)'
    : 'inset(16% 33% 16% 33% round 999px 999px 0 0)';
  const archEnd = 'inset(0% 0% 0% 0% round 0px)';

  gsap.set(archWrap, { clipPath: archStart });
  gsap.set(archImg,  { scale: 1.35 });
  gsap.set(scrim,    { opacity: 0 });
  gsap.set(caption,  { opacity: 0 });

  // ── Split caption chars for stagger reveal
  let captionChars = [];
  if (captionTxt) {
    captionChars = splitChars(captionTxt);
    gsap.set(captionChars, { y: '105%' });
  }

  // ── ONE scrubbed timeline ───────────────────
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  // 0% → 65%: arch opens, image descales, words drift + fade, labels fade
  tl.to(archWrap, {
    clipPath: archEnd,
    duration: 0.65,
  }, 0)
  .to(archImg, {
    scale: 1,
    duration: 0.65,
  }, 0)
  .to([wordLeft, wordRight].filter(Boolean), {
    opacity: 0,
    duration: 0.45,
  }, 0);

  if (wordLeft) tl.to(wordLeft,  { x: '-30vw', duration: 0.55 }, 0);
  if (wordRight) tl.to(wordRight, { x:  '30vw', duration: 0.55 }, 0);
  if (labels.length) tl.to(labels, { opacity: 0, duration: 0.3 }, 0);

  // 65% → 75%: scrim fades in, caption fades in
  tl.to(scrim, { opacity: 1, duration: 0.12 }, 0.65);
  tl.to(caption, { opacity: 1, duration: 0.08 }, 0.68);

  // char reveal stagger (maps to a small portion of the timeline)
  if (captionChars.length) {
    tl.fromTo(captionChars,
      { y: '105%' },
      { y: '0%', duration: 0.18, stagger: 0.004 },
      0.70
    );
  }

  // 85% → 100%: hold (timeline ends naturally, scrub handles pacing)

  // ── ScrollTrigger pin ───────────────────────
  ScrollTrigger.create({
    trigger:            track,
    start:              'top top',
    end:                'bottom bottom',
    scrub:              1,
    pin:                scene,
    pinSpacing:         false,   // track already provides the scroll space
    anticipatePin:      1,
    invalidateOnRefresh: true,
    animation:          tl,
    onRefresh() { setTrackHeight(); },
  });
}

/* ═════════════════════════════════════════════
   PART B — Editorial story
   ═════════════════════════════════════════════ */
function buildPartB(section) {
  buildScrollPara(section);
  buildImageReveals(section);
  buildStatsOdometers(section);
  buildCTA(section);
}

/* ── Scroll-scrubbed paragraph ──────────────── */
function buildScrollPara(section) {
  const para = section.querySelector('.story__edit-para');
  if (!para) return;

  if (isReduced()) {
    para.querySelectorAll('.word').forEach(w => w.style.opacity = '1');
    return;
  }

  const words = splitWords(para);
  // Start each word at opacity 0.2
  gsap.set(words, { opacity: 0.2 });

  // Build a timeline that reveals each word as it enters the scrub range
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.to(words, {
    opacity: 1,
    duration: 1,
    stagger: {
      each: 0.065,
      ease: 'none',
    },
  });

  ScrollTrigger.create({
    trigger:            para,
    start:              'top 80%',
    end:                'bottom 25%',
    scrub:              1.2,
    animation:          tl,
    invalidateOnRefresh: true,
  });
}

/* ── Image clip-path reveals + parallax ────── */
function buildImageReveals(section) {
  const blocks = section.querySelectorAll('.story__img-block');

  blocks.forEach((block, i) => {
    const img = block.querySelector('img') || block.querySelector('.story__img-block-placeholder');
    if (!img) return;

    if (isReduced()) return;

    // Initial state: visible by default if trigger does not fire
    block.style.opacity = '1';
    block.style.clipPath = 'inset(0)';
    img.style.opacity = '1';
    img.style.clipPath = 'inset(0)';

    // Clip reveal on enter (not scrubbed — fires once)
    ScrollTrigger.create({
      trigger: block,
      start:   'top 85%',
      once:    true,
      invalidateOnRefresh: true,
      onEnter() {
        gsap.fromTo(block,
          { clipPath: 'inset(0 0 100% 0)', opacity: 0.8 },
          {
            clipPath: 'inset(0 0 0% 0)',
            opacity: 1,
            duration: 1.1,
            ease:     'power3.inOut',
            onComplete() {
              block.style.clipPath = 'inset(0)';
              block.style.opacity = '1';
              img.style.clipPath = 'inset(0)';
              img.style.opacity = '1';
            }
          }
        );
      },
    });

    // Parallax scale on scroll (different speeds per image)
    const scaleAmt  = i === 0 ? 1.12 : 1.08;
    const yAmt      = i === 0 ? 60   : 40;
    gsap.set(img, { scale: scaleAmt });

    ScrollTrigger.create({
      trigger: block,
      start:   'top bottom',
      end:     'bottom top',
      scrub:   true,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const p = self.progress;
        // Scale from scaleAmt → 1 as it scrolls through
        gsap.set(img, {
          scale: scaleAmt - (scaleAmt - 1) * p,
          y: -yAmt * p + (yAmt / 2),
        });
      },
    });
  });
}

/* ── Odometer stats on viewport enter ───────── */
function buildStatsOdometers(section) {
  const statsRow = section.querySelector('.story__stats-row');
  if (!statsRow) return;

  const statEls = statsRow.querySelectorAll('.story__stat-value');

  // Guard: only animate once
  let animated = false;

  ScrollTrigger.create({
    trigger:            statsRow,
    start:              'top 80%',
    once:               true,
    invalidateOnRefresh: true,
    onEnter() {
      if (animated) return;
      animated = true;

      statEls.forEach((el, i) => {
        if (isReduced()) {
          el.style.opacity = '1';
          return;
        }
        initOdometer(el, {
          duration: 1.9,
          delay:    i * 0.18,
          ease:     'power3.out',
        });
      });
    },
  });
}

/* ── Circular magnetic CTA ──────────────────── */
function buildCTA(section) {
  const cta = section.querySelector('.story__cta');
  if (!cta) return;

  initMagnetic(cta, { strength: 0.4, radius: 110 });
}

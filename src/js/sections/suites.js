/**
 * MAISON ÉTÉ · The Suites Section
 *
 * INTRO — normal flow, bone bg, words reveal on enter
 * PINNED GALLERY — horizontal scroll, 3 × 100vw panels
 *   Single ScrollTrigger, scrub: 1, pin: true, anticipatePin: 1
 *   Active-panel logic from self.progress (switch at 0.333 and 0.666)
 *   Counter "01 / 03" with odometer digits (never overlaps)
 *   1px olive progress line with labelled ticks (LA GARRIGUE / LE LUBERON / LES ALPILLES)
 *   Click tick scrolls to panel with Lenis (expo.inOut, 1.4s)
 *   Image tilt (max 4deg, quickTo, perspective 1000px, skip on touch)
 *   Parallax x (-40px to 40px relative to track scroll)
 *   Image scale 1.15 → 1 on active panel
 *   Spec odometer digits
 * MOBILE STACK — vertically stacked, scroll reveal
 * FOOTER STRIP — normal flow, cream, 120px tall
 *
 * Rules:
 *   Single Lenis instance
 *   pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true
 *   No overflow:hidden or transform on pin ancestors
 */
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitChars }    from '../lib/splitter.js';
import { initOdometer }   from '../lib/odometer.js';
import { initMagnetic }   from '../lib/magnetic.js';

const isMobile  = () => window.innerWidth <= 900;
const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* expo.inOut easing function */
const expoInOut = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

/* ─────────────────────────────────────────────
   Main Entry Point
   ───────────────────────────────────────────── */
export function initSuites(lenis) {
  const section = document.getElementById('suites');
  if (!section) return;

  // Initialize magnetic buttons in suites section (desktop with hover only)
  if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    section.querySelectorAll('[data-magnetic]').forEach(el => initMagnetic(el));
  }

  // Build Intro word reveal
  buildIntro(section);

  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', () => {
    if (!isReduced()) {
      buildPinnedGallery(section, lenis);
    } else {
      buildMobileStack(section);
    }
  });

  mm.add('(max-width: 900px)', () => {
    buildMobileStack(section);
  });

  // Refresh ScrollTrigger after mounting, after images load, and after fonts ready
  scheduleRefresh(section);
}

/* ─────────────────────────────────────────────
   INTRO — Word Reveal on Enter
   ───────────────────────────────────────────── */
function buildIntro(section) {
  const headline = section.querySelector('.suites__headline');
  if (!headline) return;

  if (isReduced()) return;

  // Split headline text into wrapped words for clean mask reveal
  headline.innerHTML = `
    <span class="word-wrap"><span class="word">Three</span></span>
    <span class="word-wrap"><span class="word">ways</span></span>
    <span class="word-wrap"><span class="word">to</span></span>
    <span class="word-wrap"><span class="word word--accent">stay.</span></span>
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
   PINNED HORIZONTAL GALLERY (Desktop)
   ───────────────────────────────────────────── */
function buildPinnedGallery(section, lenis) {
  const pin   = section.querySelector('#suites-pin');
  const track = section.querySelector('.suites__track');
  if (!pin || !track) return;

  const panels = [...track.querySelectorAll('.suites__panel')];
  const PANEL_COUNT = panels.length;

  const counterSlides = section.querySelector('.suites__counter-slides');
  const progressFill  = section.querySelector('.suites__progress-fill');
  const ticks         = [...section.querySelectorAll('.suites__tick')];

  /* ── 1. Split characters in panel names & descs ── */
  panels.forEach((panel) => {
    const name = panel.querySelector('.suites__panel-name');
    const desc = panel.querySelector('.suites__panel-desc');

    if (name) {
      splitIntoCharWrappers(name);
    }
    if (desc) {
      splitIntoCharWrappers(desc);
    }
  });

  /* ── 2. Cache spec odometer target values ── */
  panels.forEach((panel) => {
    panel.querySelectorAll('.suites__spec-value').forEach((el) => {
      const val = el.dataset.val || el.textContent.trim();
      el.dataset.val = val;
    });
  });

  /* ── 3. Image tilt setup (quickTo, max 4deg, perspective 1000px) ── */
  panels.forEach((panel) => {
    const frame = panel.querySelector('.suites__img-frame');
    if (!frame || window.matchMedia('(hover: none)').matches) return;

    frame.style.perspective = '1000px';

    const setRX = gsap.quickTo(frame, 'rotationX', { duration: 0.35, ease: 'power2.out' });
    const setRY = gsap.quickTo(frame, 'rotationY', { duration: 0.35, ease: 'power2.out' });

    frame.addEventListener('mousemove', (e) => {
      const rect = frame.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 to +0.5
      const ny = (e.clientY - rect.top)  / rect.height - 0.5; // -0.5 to +0.5

      // Max 4 deg tilt toward cursor
      setRY(nx * 8);
      setRX(-ny * 8);
    });

    frame.addEventListener('mouseleave', () => {
      setRX(0);
      setRY(0);
    });
  });

  /* ── 4. Track scroll distance calculation ── */
  const getScrollDist = () => track.scrollWidth - window.innerWidth;

  /* ── 5. Active panel state & transitions ── */
  let currentActive = -1;

  function activatePanel(idx) {
    if (idx === currentActive) return;
    currentActive = idx;

    panels.forEach((panel, i) => {
      const isActive = (i === idx);
      panel.classList.toggle('is-active', isActive);

      const panelBody = panel.querySelector('.suites__panel-body');
      if (!panelBody) return;

      if (!isActive) {
        // Inactive panels fade to opacity 0 and get visibility hidden
        gsap.to(panelBody, {
          opacity: 0,
          duration: 0.35,
          ease: 'power2.in',
          overwrite: 'auto',
          onComplete() {
            if (i !== currentActive) {
              panelBody.style.visibility = 'hidden';
            }
          },
        });
      } else {
        // Active panel: visible and animate text in
        panelBody.style.visibility = 'visible';
        gsap.to(panelBody, {
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        });

        // Chars rise with stagger, 0.8s, power3.out
        const chars = panel.querySelectorAll('.char');
        if (chars.length) {
          gsap.fromTo(chars,
            { y: '110%' },
            {
              y: '0%',
              duration: 0.8,
              stagger: 0.016,
              ease: 'power3.out',
              overwrite: 'auto',
            }
          );
        }

        // Animate spec odometers
        panel.querySelectorAll('.suites__spec-value').forEach((el, specIdx) => {
          const raw = el.dataset.val;
          if (raw) {
            el.textContent = raw;
            initOdometer(el, {
              duration: 1.2,
              delay: 0.2 + specIdx * 0.12,
              ease: 'power3.out',
            });
          }
        });
      }
    });

    // Counter rolls to active number (never overlaps)
    if (counterSlides) {
      gsap.to(counterSlides, {
        y: `${-idx * 1.2}em`,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }

    // Tick active state
    ticks.forEach((tick, i) => {
      tick.classList.toggle('is-active', i === idx);
    });
  }

  /* ── 6. Initial state: Panel 0 active, others hidden ── */
  panels.forEach((panel, i) => {
    const panelBody = panel.querySelector('.suites__panel-body');
    if (panelBody) {
      if (i === 0) {
        panelBody.style.visibility = 'visible';
        panelBody.style.opacity = '1';
      } else {
        panelBody.style.visibility = 'hidden';
        panelBody.style.opacity = '0';
      }
    }
  });

  /* ── 7. Tick clicks → scroll with Lenis (expo.inOut, 1.4s) ── */
  ticks.forEach((tick, i) => {
    tick.addEventListener('click', () => {
      if (!lenis || !st) return;

      const pinStart   = st.start;
      const totalDist  = st.end - st.start;
      const fraction   = i / (PANEL_COUNT - 1); // 0, 0.5, 1.0
      const targetScroll = pinStart + totalDist * fraction;

      lenis.scrollTo(targetScroll, {
        duration: 1.4,
        easing: expoInOut,
      });
    });
  });

  /* ── 8. Image parallax references ── */
  const innerWrappers = panels.map(p => p.querySelector('.suites__img-inner'));

  /* ── 9. Main GSAP Timeline & ScrollTrigger Pin ── */
  // Animate the track with x: -(trackWidth - 100vw), ease "none", scrub: 1, pin: true, anticipatePin: 1
  const trackTween = gsap.to(track, {
    x: () => -(getScrollDist()),
    ease: 'none',
  });

  const st = ScrollTrigger.create({
    trigger:             pin,
    start:               'top top',
    end:                 () => '+=' + getScrollDist(),
    scrub:               1,
    pin:                 true,
    pinSpacing:          true,
    anticipatePin:       1,
    invalidateOnRefresh: true,
    animation:           trackTween,

    onUpdate(self) {
      const p = self.progress;

      // 1. Progress line fill
      if (progressFill) {
        progressFill.style.width = `${Math.min(100, Math.max(0, p * 100))}%`;
      }

      // 2. Active panel switch at progress 0.333 and 0.666
      const activeIdx = p < 0.333 ? 0 : (p < 0.666 ? 1 : 2);
      activatePanel(activeIdx);

      // 3. Slow internal parallax: image moves x -40px to 40px relative to track scroll
      // Map p (0 to 1) directly to (-40px to +40px)
      const parallaxX = -40 + p * 80;
      innerWrappers.forEach((wrapper) => {
        if (wrapper) {
          gsap.set(wrapper, { x: parallaxX });
        }
      });
    },

    onEnter() {
      activatePanel(0);
    },
  });

  // Activate first panel initially
  activatePanel(0);
}

/* ─────────────────────────────────────────────
   Character Splitter with Overflow Wrap
   ───────────────────────────────────────────── */
function splitIntoCharWrappers(el) {
  const text = el.textContent.trim();
  el.innerHTML = '';
  el.style.opacity = '1';

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
    }
  }
}

/* ─────────────────────────────────────────────
   MOBILE STACK — Scroll Reveal per Panel
   ───────────────────────────────────────────── */
function buildMobileStack(section) {
  const panels = section.querySelectorAll('.suites__mobile-panel');
  if (!panels.length || isReduced()) return;

  panels.forEach((panel) => {
    const img = panel.querySelector('.suites__mobile-img');
    const meta = panel.querySelector('.suites__mobile-meta');

    if (img) {
      // Visible by default if trigger does not fire
      img.style.opacity = '1';
      img.style.clipPath = 'inset(0)';
      const innerImg = img.querySelector('img') || img.querySelector('.suites__mobile-img-placeholder');
      if (innerImg) {
        innerImg.style.opacity = '1';
        innerImg.style.clipPath = 'inset(0)';
      }

      ScrollTrigger.create({
        trigger: panel,
        start:   'top 85%',
        once:    true,
        invalidateOnRefresh: true,
        onEnter() {
          gsap.fromTo(img,
            { clipPath: 'inset(0 0 100% 0)', opacity: 0.8 },
            {
              clipPath: 'inset(0 0 0% 0)',
              opacity: 1,
              duration: 1.0,
              ease: 'power3.inOut',
              onComplete() {
                img.style.clipPath = 'inset(0)';
                img.style.opacity = '1';
                if (innerImg) {
                  innerImg.style.clipPath = 'inset(0)';
                  innerImg.style.opacity = '1';
                }
              }
            }
          );
        },
      });
    }

    if (meta) {
      gsap.set(meta, { opacity: 0, y: 24 });
      ScrollTrigger.create({
        trigger: panel,
        start:   'top 80%',
        once:    true,
        invalidateOnRefresh: true,
        onEnter() {
          gsap.to(meta, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.2,
          });
        },
      });
    }
  });
}

/* ─────────────────────────────────────────────
   ScrollTrigger Refresh Orchestrator
   ───────────────────────────────────────────── */
function scheduleRefresh(section) {
  // 1. Mount refresh
  ScrollTrigger.refresh();

  // 2. Images load refresh
  const imgs = section.querySelectorAll('img');
  let loaded = 0;
  const total = imgs.length || 1;

  const tryRefresh = () => {
    loaded++;
    if (loaded >= total) {
      ScrollTrigger.refresh();
    }
  };

  imgs.forEach((img) => {
    if (img.complete) {
      tryRefresh();
    } else {
      img.addEventListener('load',  tryRefresh, { once: true });
      img.addEventListener('error', tryRefresh, { once: true });
    }
  });

  // 3. Fonts ready refresh
  document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
  });
}

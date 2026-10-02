/**
 * MAISON ÉTÉ · Footer Section
 *
 * SECTION B: FOOTER (olive bg #2F3A2A, cream text)
 * - Giant "Maison Été" fitted to full width by measurement (binary search)
 * - Letter-by-letter fill from outline to solid, scrubbed to scroll as footer enters
 * - Live Provence-time clock (HH:MM) with odometer digits updating every minute
 * - Circular "BACK TO TOP ↑" button scrolling to top with Lenis (expo.inOut, 1.6s)
 * - Newsletter validation & confirmation
 * - Explore smooth-scroll anchor links
 */
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initMagnetic }  from '../lib/magnetic.js';
import { initOdometer }  from '../lib/odometer.js';

const expoInOut = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

export function initFooter(lenis) {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  // 1. Fit giant brand title to container width
  const brandWrap = footer.querySelector('.footer__brand-wrap');
  const outlineEl = footer.querySelector('.footer__brand-outline');
  const solidEl   = footer.querySelector('.footer__brand-solid');

  if (brandWrap && outlineEl && solidEl) {
    fitBrandTitle(outlineEl, solidEl, brandWrap);
    window.addEventListener('resize', () => {
      fitBrandTitle(outlineEl, solidEl, brandWrap);
    });
  }

  // 2. Letter-by-letter scrubbed fill from outline to solid
  buildTitleScrub(footer);

  // 3. Live local Provence-time clock (Europe/Paris timezone)
  initProvenceClock(footer);

  // 4. Circular Back-to-Top button
  const backToTopBtn = footer.querySelector('#back-to-top');
  if (backToTopBtn && lenis) {
    initMagnetic(backToTopBtn);
    backToTopBtn.addEventListener('click', () => {
      lenis.scrollTo(0, {
        duration: 1.6,
        easing: expoInOut,
      });
    });
  }

  // 5. Explore smooth-scroll links
  footer.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target && lenis) {
        e.preventDefault();
        lenis.scrollTo(target, {
          duration: 1.4,
          easing: expoInOut,
        });
      }
    });
  });

  // 6. Newsletter validation
  initNewsletter(footer);
}

/* ─────────────────────────────────────────────
   Fit Brand Title by measurement (binary search)
   ───────────────────────────────────────────── */
function fitBrandTitle(outlineEl, solidEl, container) {
  if (!container || !outlineEl || !solidEl) return;

  const maxW = container.offsetWidth;
  if (maxW <= 0) return;

  outlineEl.style.fontSize = '10px';
  solidEl.style.fontSize = '10px';

  let lo = 16, hi = 450;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    outlineEl.style.fontSize = mid + 'px';
    if (outlineEl.scrollWidth <= maxW) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const finalSize = Math.floor(lo) + 'px';
  outlineEl.style.fontSize = finalSize;
  solidEl.style.fontSize = finalSize;
}

/* ─────────────────────────────────────────────
   Letter-by-letter fill scrubbed as footer enters
   ───────────────────────────────────────────── */
function buildTitleScrub(footer) {
  const chars = footer.querySelectorAll('.footer__brand-solid .footer__char');
  const outlineEl = footer.querySelector('.footer__brand-outline');
  if (!chars.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    chars.forEach(ch => { ch.style.opacity = '1'; });
    if (outlineEl) outlineEl.style.visibility = 'hidden';
    return;
  }

  gsap.set(chars, { opacity: 0 });
  if (outlineEl) outlineEl.style.visibility = 'visible';

  gsap.to(chars, {
    opacity: 1,
    stagger: 0.1,
    ease: 'power1.inOut',
    scrollTrigger: {
      trigger: footer,
      start:   'top 90%',
      end:     'top 35%',
      scrub:   1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        if (outlineEl) {
          outlineEl.style.visibility = self.progress >= 0.98 ? 'hidden' : 'visible';
        }
      }
    }
  });
}

/* ─────────────────────────────────────────────
   Live Provence-Time Clock (Europe/Paris)
   ───────────────────────────────────────────── */
function initProvenceClock(footer) {
  const timeEl = footer.querySelector('#footer-time');
  if (!timeEl) return;

  function updateClock() {
    if (document.hidden) return;
    const now = new Date();
    // Provence time is Europe/Paris
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const timeStr = formatter.format(now);
    if (timeEl.textContent !== timeStr) {
      timeEl.textContent = timeStr;
    }
  }

  updateClock();

  let clockInterval = null;
  function startClock() {
    if (!clockInterval) {
      updateClock();
      clockInterval = setInterval(updateClock, 30000);
    }
  }
  function stopClock() {
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopClock();
    } else {
      startClock();
    }
  });

  startClock();
}

/* ─────────────────────────────────────────────
   Newsletter Form Validation
   ───────────────────────────────────────────── */
function initNewsletter(footer) {
  const form = footer.querySelector('#footer-newsletter');
  const input = footer.querySelector('#newsletter-email');
  const msgEl = footer.querySelector('#newsletter-msg');
  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const val = input.value.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(val)) {
      if (msgEl) {
        msgEl.textContent = 'Please enter a valid email address.';
        msgEl.className = 'newsletter-msg is-error';
      }
      return;
    }

    // Success swap
    input.value = '';
    input.disabled = true;
    const btn = form.querySelector('.newsletter-submit-btn');
    if (btn) btn.disabled = true;

    if (msgEl) {
      msgEl.textContent = "You're on the list. Merci.";
      msgEl.className = 'newsletter-msg is-success';
    }
  });
}

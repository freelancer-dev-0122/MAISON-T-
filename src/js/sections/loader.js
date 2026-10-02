/**
 * MAISON ÉTÉ · Loader Section
 * Percentage counter, progress bar, Fraunces wordmark fade-up,
 * expo.inOut clip-path wipe exit.
 * Locks Lenis during loading, releases + triggers ScrollTrigger.refresh on exit.
 */
import { gsap } from 'gsap';

export function initLoader(lenis, onComplete) {
  const loader   = document.getElementById('loader');
  const wordmark = loader?.querySelector('.loader__wordmark');
  const fill     = loader?.querySelector('.loader__progress-fill');
  const pct      = loader?.querySelector('.loader__pct');

  if (!loader) {
    onComplete?.();
    return;
  }

  // Lock scroll
  lenis.stop();

  let progress = 0;
  let progressAnimDone = false;
  let minTimeDone      = false;

  // 1. Wordmark fades up
  gsap.to(wordmark, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: 'power3.out',
    delay: 0.15,
  });

  // 2. Progress: 0 → 80 quickly
  animateProgress(0, 80, 0.9, 0.1);

  // 3. Wait for fonts, then finish to 100
  document.fonts.ready.then(() => {
    animateProgress(progress, 100, 0.45, 0.05, () => {
      progressAnimDone = true;
      checkComplete();
    });
  });

  // 4. Minimum display time
  gsap.delayedCall(1.9, () => {
    minTimeDone = true;
    checkComplete();
  });

  // ── Helpers ──────────────────────────────────

  function animateProgress(from, to, duration, delay, onDone) {
    const proxy = { v: from };
    gsap.killTweensOf(proxy);
    gsap.to(proxy, {
      v: to,
      duration,
      delay,
      ease: 'power1.inOut',
      onUpdate() {
        progress = Math.round(proxy.v);
        if (fill) fill.style.width = progress + '%';
        if (pct)  pct.textContent  = progress + '%';
      },
      onComplete: onDone,
    });
  }

  function checkComplete() {
    if (minTimeDone && progressAnimDone) {
      exitLoader();
    }
  }

  function exitLoader() {
    // Prevent double-call
    if (loader.dataset.exited) return;
    loader.dataset.exited = 'true';

    // Snap bar to 100%
    if (fill) fill.style.width = '100%';
    if (pct)  pct.textContent  = '100%';

    // Clip-path wipe upward with expo.inOut
    gsap.to(loader, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.1,
      ease: 'expo.inOut',
      delay: 0.3,
      onComplete: () => {
        loader.style.display = 'none';
        lenis.start();
        onComplete?.();
      },
    });
  }
}

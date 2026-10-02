/**
 * MAISON ÉTÉ · Marquee Helper
 *
 * Smooth horizontal ticker driven by ticker/rAF
 * Integrates with Lenis scroll velocity:
 *   - Accelerates with scroll velocity
 *   - Skews up to 5deg during fast scroll, easing back to 0
 *   - Pauses on hover
 *   - Pauses when offscreen (ScrollTrigger / IntersectionObserver)
 *   - Reduced-motion: static or slow constant scroll with no skew
 */
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function createMarquee(container, options = {}) {
  const {
    direction = 'left',      // 'left' or 'right'
    speed = 1.0,             // base pixels per frame
    lenis = null,            // Lenis instance for velocity tracking
    maxSkew = 5,             // max degrees
  } = options;

  if (!container) return null;

  const track = container.querySelector('.marquee__track');
  if (!track) return null;

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Duplicate content inside track for seamless looping if needed
  const content = track.firstElementChild;
  if (!content) return null;

  // Ensure enough copies to wrap seamlessly
  let totalWidth = content.offsetWidth;
  if (totalWidth === 0) {
    totalWidth = 1200; // fallback before layout
  }

  let x = 0;
  let isHovered = false;
  let isVisible = true;
  let currentSkew = 0;

  // Quick setter for skew
  const setSkew = gsap.quickTo(track, 'skewX', { duration: 0.35, ease: 'power2.out' });

  // Hover listeners to pause
  container.addEventListener('mouseenter', () => { isHovered = true; });
  container.addEventListener('mouseleave', () => { isHovered = false; });

  // Pause on document hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isVisible = false;
    } else {
      const rect = container.getBoundingClientRect();
      isVisible = (rect.bottom > 0 && rect.top < window.innerHeight);
    }
  });

  // Visibility via ScrollTrigger
  ScrollTrigger.create({
    trigger: container,
    start:   'top bottom',
    end:     'bottom top',
    onEnter:     () => { if (!document.hidden) isVisible = true; },
    onLeave:     () => { isVisible = false; },
    onEnterBack: () => { if (!document.hidden) isVisible = true; },
    onLeaveBack: () => { isVisible = false; },
  });

  // Animation update loop
  const dirMultiplier = direction === 'left' ? -1 : 1;

  function update() {
    if (!isVisible || document.hidden) return;

    let velocityBonus = 0;
    let targetSkew = 0;

    if (lenis && !isReduced) {
      const v = lenis.velocity || 0;
      velocityBonus = Math.abs(v) * 0.45;

      // Skew follows scroll velocity direction
      const rawSkew = (v * 0.18);
      targetSkew = Math.max(-maxSkew, Math.min(maxSkew, rawSkew));
    }

    if (!isReduced) {
      setSkew(targetSkew);
    }

    if (!isHovered) {
      const step = (speed + velocityBonus) * dirMultiplier;
      x += step;

      const singleWidth = content.offsetWidth || totalWidth;
      if (singleWidth > 0) {
        if (direction === 'left' && x <= -singleWidth) {
          x += singleWidth;
        } else if (direction === 'right' && x >= 0) {
          x -= singleWidth;
        }
      }

      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }
  }

  gsap.ticker.add(update);

  return {
    destroy() {
      gsap.ticker.remove(update);
    },
  };
}

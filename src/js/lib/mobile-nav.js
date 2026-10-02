/**
 * MAISON ÉTÉ · Mobile Navigation Overlay
 * - Collapsible full-screen olive overlay with Fraunces links
 * - GSAP staggered reveal
 * - Scroll lock via lenis.stop() and guaranteed lenis.start() on close
 * - Smooth scroll anchor navigation with 96px offset
 */
import { gsap } from 'gsap';

export function initMobileNav(lenis) {
  const menuBtn   = document.getElementById('nav-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const closeBtn  = document.getElementById('mobile-nav-close');

  if (!menuBtn || !mobileNav) return;

  const links = mobileNav.querySelectorAll('.mobile-nav__link');
  let isOpen = false;

  function openMenu() {
    if (isOpen) return;
    isOpen = true;

    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');

    // Scroll lock via Lenis & body
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';

    // Staggered reveal of links
    gsap.fromTo(links,
      { y: 35, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power3.out',
        overwrite: 'auto',
      }
    );
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;

    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');

    // Guaranteed unlock
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeMenu();
    }
  });

  // Smooth scroll with 96px offset on link click
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      closeMenu();

      if (href && href.startsWith('#')) {
        const targetSelector = href === '#rooms' ? '#suites' : href;
        const target = document.querySelector(targetSelector);
        if (target && lenis) {
          e.preventDefault();
          // Ensure scrolling is active
          if (lenis) lenis.start();
          setTimeout(() => {
            lenis.scrollTo(target, {
              offset: -96,
              duration: 1.2,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });
          }, 150);
        }
      }
    });
  });

  // Expose close helper for external safety
  return {
    open: openMenu,
    close: closeMenu,
    isOpen: () => isOpen,
  };
}

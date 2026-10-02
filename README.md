# Maison Été — Boutique Hotel, Provence

> *A quiet house between the olive groves and the sea.*

A luxury boutique hotel website for Maison Été (Est. 1924, Route des Oliviers, 84220 Gordes, Provence, France). Built with an editorial luxury aesthetic, warm Provençal palette, synchronized Lenis smooth scrolling, GSAP ScrollTrigger animations, interactive multi-step suite reservation engine, and full responsive + accessibility engineering.

---

## What I Built (Portfolio / Freelance Showcase)

> **Copy & Paste for Upwork & Contra:**
>
> Designed and engineered **Maison Été**, an award-caliber boutique hotel web experience celebrating 100 years of Provençal hospitality. Built with pure Vanilla JavaScript and modern CSS tokens (zero CSS frameworks), the site features a synchronized Lenis smooth-scrolling architecture driving complex GSAP ScrollTrigger timelines: an interactive arched architectural window reveal, a 300vw pinned horizontal suites gallery with odometer digit counters that gracefully transforms into an editorial vertical stack on mobile, an ambient dual-track marquee with velocity skew, and a custom interactive 3-step suite reservation booking engine with live calendar range selection, add-on calculations, and animated SVG confirmations. Optimized for performance and accessibility with automated WebP/JPG responsive srcsets, eager hero preloading, 100svh dynamic viewport management, touch-device adaptions (tap-to-expand accordions, 44px tap targets, native touch cursor fallbacks), strict semantic landmark structuring, and full WCAG AA contrast and keyboard operability.

---

## Tech Stack

| Layer | Choice & Notes |
|---|---|
| **Bundler & Tooling** | [Vite 8](https://vitejs.dev/) — Lightning-fast development & production tree-shaking |
| **Language** | Vanilla JavaScript (ES Modules, zero framework overhead) |
| **Animations & Timelines** | [GSAP 3](https://gsap.com/) + ScrollTrigger + quickTo velocity tracking |
| **Scroll Engine** | [Lenis 1.3](https://lenis.darkroom.engineering/) — Single instance driven by GSAP ticker |
| **Styling** | Vanilla CSS with custom properties (`tokens.css`), clamp() fluid typography, no Tailwind |
| **Typography** | [Fraunces](https://fonts.google.com/specimen/Fraunces) (Display) & [Inter Tight](https://fonts.google.com/specimen/Inter+Tight) (Body) via Google Fonts with `font-display: swap` |
| **Media & Formats** | Modern WebP with high-resolution JPG fallbacks, responsive picture tags |

---

## Key Features & Architecture

1. **Precision Responsive Viewports (1920px down to 375px):**
   - Hero and split booking bottom bar engineered with `100svh` to stay perfectly visible in a single desktop viewport.
   - Fluid typography with CSS `clamp()` ensuring zero clipped or overlapping text across ultra-wide, desktop, tablet, and mobile screens.
   - Mobile bottom bar automatically stacks booking inputs above and live stats below without obscuring the hero title.

2. **Mobile Navigation Overlay:**
   - Floating pill navigation collapses to brand wordmark + "Menu" toggle on screens `<= 900px`.
   - Full-screen olive overlay featuring oversized italic Fraunces links (Rooms, Experiences, Story, Reserve), close button, and GSAP staggered entrance.
   - Bulletproof scroll lock using `lenis.stop()` on open and guaranteed `lenis.start()` on close/ESC/anchor navigation.

3. **Pinned Sections & Breakpoint Transitions:**
   - **The Story Arch:** 220vh scroll pin on mobile with custom arch clip-path inset; 300vh full reveal on desktop.
   - **The Suites Gallery:** Desktop 300vw horizontal pinned track with odometer counter; automatically switches via `gsap.matchMedia()` to a vertical stack on tablet/mobile with reveal animations per panel and zero layout jumps.

4. **Performance & Asset Delivery:**
   - Serves genuine optimized WebP images with JPG fallbacks and `srcset`.
   - Hero image and display fonts preloaded in `<head>`.
   - `loading="lazy"` and `decoding="async"` on all below-the-fold media with explicit `width` and `height` dimensions to guarantee CLS < 0.05.
   - Loops, intervals, and marquee tickers automatically pause when scrolled offscreen or when `document.hidden`.

5. **Touch & Mobile Ergonomics:**
   - Custom cursor, magnetic effects, and floating mouse hover previews automatically disabled on touch devices (`hover: none` and `pointer: coarse`).
   - Experience list converts to a smooth accordion tap-to-expand interface on mobile.
   - Minimum 44px tap targets across all buttons, inputs, links, and calendar dates.

6. **Accessibility & SEO:**
   - Semantic HTML5 landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
   - Skip-to-content accessibility link.
   - Terracotta `:focus-visible` rings on all interactive elements.
   - Fully keyboard-navigable calendar with Arrow keys, Enter, Space, Home, and End support.
   - `aria-live="polite"` real-time updates on price calculations.
   - Complete Open Graph, Twitter card, theme-color metadata, and JSON-LD `Hotel` structured schema.

---

## Local Setup & Development

### Prerequisites
- Node.js 18+ and npm installed

### Installation
```bash
# Clone or navigate to the project directory
cd "MAISON ÉTÉ"

# Install dependencies
npm install

# Start local development server
npm run dev
```

The site will be live at `http://localhost:5173`.

---

## Production Build & Preview

```bash
# Compile and optimize production bundle into /dist
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment Steps

The `/dist` directory contains a static production bundle ready for zero-config deployment to any modern static hosting provider:

### Vercel
```bash
# Install Vercel CLI (optional) or push to GitHub and import in Vercel:
# Build Command: npm run build
# Output Directory: dist
vercel
```

### Netlify
```bash
# Using Netlify CLI:
netlify deploy --prod --dir=dist

# Or connect repository in Netlify dashboard:
# Build Command: npm run build
# Publish Directory: dist
```

---

## Breakpoint Testing Matrix

The layout and interactive behaviors have been audited across standard breakpoints:

- **1920px (Ultra-wide Desktop):** Full 100svh hero + bottom bar, 300vw horizontal suites track, dual marquee, floating hover preview.
- **1440px (Standard Desktop):** Editorial proportions, magnetic hover interactions, custom cursor with view/book labels.
- **1280px (Small Desktop / Laptop):** Fluid clamp typography scales gracefully, zero overflow.
- **1024px (Tablet Landscape / iPad Pro):** Compact nav pill, responsive grid alignment, smooth Lenis inertia.
- **768px (Tablet Portrait / iPad):** Pinned horizontal gallery seamlessly swaps to vertical stacked cards; mobile menu toggle activated.
- **414px (Large Mobile / iPhone Plus/Max):** Stacked bottom bar with clean touch target padding (>= 44px), full-screen olive navigation overlay.
- **375px (Standard Mobile / iPhone):** Compact booking inputs, fluid Fraunces headline scaling, no horizontal scrollbar or clipping.

---

## License

Private portfolio project. All rights reserved.

/**
 * MAISON ÉTÉ · Reserve Section & Interactive Booking Widget
 *
 * SECTION A: RESERVE (bone bg, 12-col grid)
 * - Left: "Your room is waiting." headline word reveal, slow parallax arch frame
 * - Right: 3-step booking card
 *   - Step 1: Two-month calendar (Oct 2026 onward), hover preview, range fill,
 *             nights odometer, guest stepper (1-4), disabled continue pill
 *   - Step 2: 3 suite cards (La Garrigue €390, Le Luberon €460, Les Alpilles €520),
 *             add-on chips (breakfast +€28/guest/night, transfer +€85),
 *             live price summary with taxes (8%) and animated total odometer
 *   - Step 3: Name & email validation, 1.2s loading, SVG check drawing,
 *             "Merci, {firstName}." screen with booking reference & reset link
 * - Smooth step slide + fade (power3.inOut, 0.6s) with card height tween
 * - Lenis smooth scroll on all reserve triggers
 * - Preselect suite via custom event 'maison:select-suite'
 */
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initOdometer }  from '../lib/odometer.js';
import { initMagnetic }  from '../lib/magnetic.js';
import { getImage }      from '../lib/assets.js';

const SUITES = [
  { id: 'garrigue', name: 'La Garrigue', rate: 390, thumb: getImage('suite-1') || '/src/assets/img/suite-1.jpg', maxGuests: 2, size: '42 m²' },
  { id: 'luberon',  name: 'Le Luberon',  rate: 460, thumb: getImage('suite-2') || '/src/assets/img/suite-2.jpg', maxGuests: 3, size: '54 m²' },
  { id: 'alpilles', name: 'Les Alpilles', rate: 520, thumb: getImage('suite-3') || '/src/assets/img/suite-3.jpg', maxGuests: 4, size: '68 m²' },
];

const ADDONS = {
  breakfastRate: 28, // per guest per night
  transferFlat:  85, // flat fee
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const expoInOut = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

export function initReserve(lenis) {
  const section = document.getElementById('reserve');
  if (!section) return;

  // 1. Headline word reveal
  buildHeadline(section);

  // 2. Slow parallax on left arch image
  buildParallax(section);

  // 3. Booking widget controller
  const bookingWidget = createBookingWidget(section, lenis);

  // 4. Global navigation & trigger wiring
  wireReserveTriggers(lenis, bookingWidget);

  // 5. Magnetic CTA buttons
  section.querySelectorAll('[data-magnetic]').forEach(el => initMagnetic(el));

  // Schedule refresh
  scheduleRefresh(section);
}

/* ─────────────────────────────────────────────
   Headline word reveal
   ───────────────────────────────────────────── */
function buildHeadline(section) {
  const headline = section.querySelector('.reserve__headline');
  if (!headline) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  headline.innerHTML = `
    <span class="word-wrap"><span class="word">Your</span></span>
    <span class="word-wrap"><span class="word">room</span></span>
    <span class="word-wrap"><span class="word">is</span></span>
    <span class="word-wrap"><span class="word word--accent">waiting.</span></span>
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
   Slow Parallax on Left Arch Image
   ───────────────────────────────────────────── */
function buildParallax(section) {
  const imgInner = section.querySelector('.reserve__image-inner');
  if (!imgInner || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.fromTo(imgInner,
    { y: -30 },
    {
      y: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start:   'top bottom',
        end:     'bottom top',
        scrub:   1,
      }
    }
  );
}

/* ─────────────────────────────────────────────
   3-Step Booking Widget
   ───────────────────────────────────────────── */
function createBookingWidget(section, lenis) {
  const card = section.querySelector('.booking-card');
  if (!card) return null;

  // Single plain JS object for all booking state
  const state = {
    step: 1,
    checkIn: null,     // Date object
    checkOut: null,    // Date object
    hoverDate: null,   // Date object for range preview
    nights: 0,
    guests: 2,
    suiteIndex: 0,
    addons: {
      breakfast: false,
      transfer: false,
    },
    guestInfo: {
      name: '',
      email: '',
      notes: '',
    },
    bookingRef: '',
    currentCalMonth: 9, // 0-indexed: 9 = October
    currentCalYear: 2026,
  };

  const stepsWrap = card.querySelector('.booking-card__content-wrap');
  const stepElements = [
    card.querySelector('#booking-step-1'),
    card.querySelector('#booking-step-2'),
    card.querySelector('#booking-step-3'),
  ];
  const stepNavItems = [...card.querySelectorAll('.booking-card__step-item')];
  const progressFill = card.querySelector('.booking-card__progress-fill');

  /* ── Calendar Elements ── */
  const calMonthsWrap = card.querySelector('.cal-months-wrap');
  const prevMonthBtn  = card.querySelector('#cal-prev');
  const nextMonthBtn  = card.querySelector('#cal-next');
  const nightsValEl   = card.querySelector('.nights-indicator__value');
  const guestsValEl   = card.querySelector('.guests-count');
  const guestsMinusBtn= card.querySelector('#guests-minus');
  const guestsPlusBtn = card.querySelector('#guests-plus');
  const step1NextBtn  = card.querySelector('#step-1-next');

  /* ── Suite Elements ── */
  const suiteCards   = [...card.querySelectorAll('.suite-card')];
  const addonChips   = [...card.querySelectorAll('.addon-chip')];
  const priceNights  = card.querySelector('#price-nights-calc');
  const priceAddons  = card.querySelector('#price-addons-calc');
  const priceTaxes   = card.querySelector('#price-taxes-calc');
  const priceTotalEl = card.querySelector('#price-total-val');
  const step2NextBtn = card.querySelector('#step-2-next');
  const step2BackBtn = card.querySelector('#step-2-back');

  /* ── Confirm Elements ── */
  const confirmForm   = card.querySelector('#confirm-form');
  const nameInput     = card.querySelector('#guest-name');
  const emailInput    = card.querySelector('#guest-email');
  const notesInput    = card.querySelector('#guest-notes');
  const step3SubmitBtn= card.querySelector('#step-3-submit');
  const step3BackBtn  = card.querySelector('#step-3-back');
  const successScreen = card.querySelector('.booking-success');
  const successNameEl = card.querySelector('#success-name');
  const successRefEl  = card.querySelector('#success-ref');
  const successSummary= card.querySelector('#success-summary-details');
  const startOverBtn  = card.querySelector('#booking-start-over');

  /* ── Initialize Calendar ── */
  renderCalendar();

  function renderCalendar() {
    if (!calMonthsWrap) return;
    calMonthsWrap.innerHTML = '';

    // Render 2 consecutive months (Month A and Month B)
    for (let offset = 0; offset < 2; offset++) {
      let m = state.currentCalMonth + offset;
      let y = state.currentCalYear;
      if (m > 11) {
        m -= 12;
        y += 1;
      }

      const monthDiv = document.createElement('div');
      monthDiv.className = 'cal-month';

      const title = document.createElement('div');
      title.className = 'cal-month__name';
      title.textContent = `${MONTH_NAMES[m]} ${y}`;
      monthDiv.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'cal-grid';

      // Day headers (Mo Tu We Th Fr Sa Su)
      ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(d => {
        const lbl = document.createElement('div');
        lbl.className = 'cal-day-label';
        lbl.textContent = d;
        grid.appendChild(lbl);
      });

      // Days of the month
      const firstDayOfMonth = new Date(y, m, 1);
      // Monday-first indexing: (getDay() + 6) % 7
      const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
      const daysInMonth = new Date(y, m + 1, 0).getDate();

      // Empty padding cells before 1st of month
      for (let e = 0; e < startDayIndex; e++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-day is-empty';
        grid.appendChild(emptyCell);
      }

      // Day buttons
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(y, m, day);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal-day';
        btn.textContent = day;
        btn.dataset.date = dateObj.toISOString().slice(0, 10);
        btn.setAttribute('aria-label', `${day} ${MONTH_NAMES[m]} ${y}`);

        // Disable dates before Oct 1, 2026
        const minDate = new Date(2026, 9, 1); // 2026-10-01
        if (dateObj < minDate) {
          btn.classList.add('is-disabled');
          btn.disabled = true;
          btn.setAttribute('aria-disabled', 'true');
        }

        // Apply selected / in-range styling
        applyDayStyles(btn, dateObj);

        // Click handler: range selection
        btn.addEventListener('click', () => onDayClick(dateObj));

        // Hover handler: range preview
        btn.addEventListener('mouseenter', () => onDayHover(dateObj));

        // Keyboard navigation (Arrow keys, Enter, Space, Home, End)
        btn.addEventListener('keydown', (e) => {
          const allActiveDays = [...calMonthsWrap.querySelectorAll('.cal-day:not(.is-empty):not([disabled])')];
          const currIdx = allActiveDays.indexOf(btn);
          if (currIdx === -1) return;

          switch (e.key) {
            case 'ArrowRight':
              if (currIdx + 1 < allActiveDays.length) {
                allActiveDays[currIdx + 1].focus();
                e.preventDefault();
              }
              break;
            case 'ArrowLeft':
              if (currIdx - 1 >= 0) {
                allActiveDays[currIdx - 1].focus();
                e.preventDefault();
              }
              break;
            case 'ArrowDown':
              if (currIdx + 7 < allActiveDays.length) {
                allActiveDays[currIdx + 7].focus();
                e.preventDefault();
              }
              break;
            case 'ArrowUp':
              if (currIdx - 7 >= 0) {
                allActiveDays[currIdx - 7].focus();
                e.preventDefault();
              }
              break;
            case 'Home': {
              const monthBtns = [...grid.querySelectorAll('.cal-day:not(.is-empty):not([disabled])')];
              if (monthBtns.length) {
                monthBtns[0].focus();
                e.preventDefault();
              }
              break;
            }
            case 'End': {
              const monthBtns = [...grid.querySelectorAll('.cal-day:not(.is-empty):not([disabled])')];
              if (monthBtns.length) {
                monthBtns[monthBtns.length - 1].focus();
                e.preventDefault();
              }
              break;
            }
            case 'Enter':
            case ' ':
              onDayClick(dateObj);
              e.preventDefault();
              break;
          }
        });

        grid.appendChild(btn);
      }

      monthDiv.appendChild(grid);
      calMonthsWrap.appendChild(monthDiv);
    }

    // Prev button disabled if at Oct 2026
    if (prevMonthBtn) {
      prevMonthBtn.disabled = (state.currentCalYear === 2026 && state.currentCalMonth <= 9);
    }
  }

  function applyDayStyles(btn, dateObj) {
    const time = dateObj.getTime();
    const inTime = state.checkIn ? state.checkIn.getTime() : null;
    const outTime = state.checkOut ? state.checkOut.getTime() : null;
    const hoverTime = state.hoverDate ? state.hoverDate.getTime() : null;

    btn.classList.remove('is-range-start', 'is-range-end', 'is-in-range');

    if (inTime && time === inTime) {
      btn.classList.add('is-range-start');
    }
    if (outTime && time === outTime) {
      btn.classList.add('is-range-end');
    }

    // Completed range
    if (inTime && outTime && time > inTime && time < outTime) {
      btn.classList.add('is-in-range');
    }

    // Hover preview range (when only checkIn is chosen)
    if (inTime && !outTime && hoverTime && hoverTime > inTime) {
      if (time > inTime && time < hoverTime) {
        btn.classList.add('is-in-range');
      }
      if (time === hoverTime) {
        btn.classList.add('is-range-end');
      }
    }
  }

  function updateAllDayStyles() {
    card.querySelectorAll('.cal-day:not(.is-empty)').forEach(btn => {
      if (btn.dataset.date) {
        const parts = btn.dataset.date.split('-');
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        applyDayStyles(btn, d);
      }
    });
  }

  function onDayClick(dateObj) {
    if (!state.checkIn || (state.checkIn && state.checkOut)) {
      // First click: select checkIn
      state.checkIn = dateObj;
      state.checkOut = null;
      state.nights = 0;
    } else if (state.checkIn && !state.checkOut) {
      if (dateObj > state.checkIn) {
        // Second click: select checkOut
        state.checkOut = dateObj;
        const diffDays = Math.round((state.checkOut - state.checkIn) / (1000 * 60 * 60 * 24));
        state.nights = Math.max(1, diffDays);
      } else {
        // Clicked before checkIn: restart with this date
        state.checkIn = dateObj;
        state.checkOut = null;
        state.nights = 0;
      }
    }

    updateNightsDisplay();
    updateAllDayStyles();
    updateStep1Button();
    calculatePrice();
  }

  function onDayHover(dateObj) {
    if (state.checkIn && !state.checkOut) {
      state.hoverDate = dateObj;
      updateAllDayStyles();
    }
  }

  calMonthsWrap?.addEventListener('mouseleave', () => {
    if (state.checkIn && !state.checkOut) {
      state.hoverDate = null;
      updateAllDayStyles();
    }
  });

  // Calendar month navigation
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      state.currentCalMonth -= 1;
      if (state.currentCalMonth < 0) {
        state.currentCalMonth = 11;
        state.currentCalYear -= 1;
      }
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      state.currentCalMonth += 1;
      if (state.currentCalMonth > 11) {
        state.currentCalMonth = 0;
        state.currentCalYear += 1;
      }
      renderCalendar();
    });
  }

  function updateNightsDisplay() {
    if (nightsValEl) {
      if (state.nights > 0) {
        nightsValEl.innerHTML = `<span>${state.nights}</span> <span class="nights-unit" style="font-size: 0.9rem; opacity: 0.6;">${state.nights === 1 ? 'night' : 'nights'}</span>`;
        const countSpan = nightsValEl.querySelector('span');
        if (countSpan) {
          initOdometer(countSpan, { duration: 0.6, ease: 'power2.out' });
        }
      } else {
        nightsValEl.innerHTML = `<span class="nights-unselected">Select your dates</span>`;
      }
    }
  }

  function updateStep1Button() {
    const helper = card.querySelector('#step-1-helper');
    if (step1NextBtn) {
      const isValid = Boolean(state.checkIn && state.checkOut && state.nights >= 1);
      step1NextBtn.disabled = !isValid;
      if (helper) {
        helper.style.display = isValid ? 'none' : 'block';
      }
    }
  }

  /* ── Guests Stepper ── */
  if (guestsMinusBtn) {
    guestsMinusBtn.addEventListener('click', () => {
      if (state.guests > 1) {
        state.guests--;
        updateGuests();
      }
    });
  }

  if (guestsPlusBtn) {
    guestsPlusBtn.addEventListener('click', () => {
      if (state.guests < 4) {
        state.guests++;
        updateGuests();
      }
    });
  }

  function updateGuests() {
    if (guestsValEl) {
      guestsValEl.textContent = state.guests;
      initOdometer(guestsValEl, { duration: 0.5, ease: 'power2.out' });
    }
    if (guestsMinusBtn) guestsMinusBtn.disabled = (state.guests <= 1);
    if (guestsPlusBtn)  guestsPlusBtn.disabled  = (state.guests >= 4);

    calculatePrice();
  }

  /* ── Suite Selection ── */
  suiteCards.forEach((sc, idx) => {
    sc.addEventListener('click', () => {
      selectSuite(idx);
    });
  });

  function selectSuite(idx) {
    state.suiteIndex = idx;
    suiteCards.forEach((c, i) => c.classList.toggle('is-selected', i === idx));
    calculatePrice();
  }

  /* ── Addons Toggles ── */
  addonChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.addon;
      if (type && type in state.addons) {
        state.addons[type] = !state.addons[type];
        chip.classList.toggle('is-active', state.addons[type]);
        calculatePrice();
      }
    });
  });

  /* ── Live Price Calculation ── */
  function calculatePrice() {
    const nights = Math.max(1, state.nights || 1);
    const suite = SUITES[state.suiteIndex];
    const roomSubtotal = suite.rate * nights;

    let addonsSubtotal = 0;
    let addonsDetailText = '';

    if (state.addons.breakfast) {
      const bTotal = ADDONS.breakfastRate * state.guests * nights;
      addonsSubtotal += bTotal;
      addonsDetailText += `Breakfast (€${bTotal})`;
    }
    if (state.addons.transfer) {
      addonsSubtotal += ADDONS.transferFlat;
      addonsDetailText += (addonsDetailText ? ' + ' : '') + `Transfer (€${ADDONS.transferFlat})`;
    }

    const subtotal = roomSubtotal + addonsSubtotal;
    const taxes = subtotal * 0.08;
    const total = Math.round(subtotal + taxes);

    // Update summary text
    if (priceNights) {
      priceNights.textContent = `${nights} ${nights === 1 ? 'night' : 'nights'} × €${suite.rate} = €${roomSubtotal.toLocaleString()}`;
    }
    if (priceAddons) {
      priceAddons.textContent = addonsSubtotal > 0 ? addonsDetailText : 'None';
    }
    if (priceTaxes) {
      priceTaxes.textContent = `€${Math.round(taxes).toLocaleString()}`;
    }
    if (priceTotalEl) {
      priceTotalEl.textContent = `€${total.toLocaleString()}`;
      initOdometer(priceTotalEl, { duration: 0.8, ease: 'power2.out' });
    }

    state.lastCalculatedTotal = total;
  }

  /* ── Step Transition Animation ── */
  function goToStep(targetStep) {
    if (targetStep < 1 || targetStep > 3 || targetStep === state.step) return;

    const currentEl = stepElements[state.step - 1];
    const nextEl    = stepElements[targetStep - 1];
    const forward   = targetStep > state.step;
    state.step      = targetStep;

    // Update step nav indicator
    stepNavItems.forEach((item, i) => {
      item.classList.toggle('is-active', i + 1 === targetStep);
      item.classList.toggle('is-completed', i + 1 < targetStep);
    });

    if (progressFill) {
      progressFill.style.width = `${(targetStep / 3) * 100}%`;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stepElements.forEach(el => el.classList.remove('is-active'));
      nextEl.classList.add('is-active');
      ScrollTrigger.refresh();
      return;
    }

    // Animate card height cleanly
    const oldHeight = card.offsetHeight;

    // Prepare next element position
    nextEl.style.display = 'block';
    nextEl.style.position = 'absolute';
    nextEl.style.top = '0';
    nextEl.style.left = '0';
    nextEl.style.width = '100%';

    const targetHeight = card.offsetHeight; // layout query while absolute

    // Reset styles for GSAP animation
    nextEl.style.position = '';
    nextEl.style.top = '';
    nextEl.style.left = '';
    nextEl.style.display = 'none';

    gsap.fromTo(card,
      { height: oldHeight },
      {
        height: targetHeight,
        duration: 0.55,
        ease: 'power3.inOut',
        onComplete() {
          card.style.height = 'auto';
          ScrollTrigger.refresh();
        }
      }
    );

    // Slide + fade tween
    const outX = forward ? -40 : 40;
    const inX  = forward ? 40 : -40;

    gsap.to(currentEl, {
      x: outX,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.inOut',
      onComplete() {
        currentEl.classList.remove('is-active');
        currentEl.style.display = 'none';
        gsap.set(currentEl, { x: 0 });
      }
    });

    nextEl.style.display = 'block';
    gsap.fromTo(nextEl,
      { x: inX, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.55,
        ease: 'power3.out',
        delay: 0.1,
        onStart() {
          nextEl.classList.add('is-active');
        }
      }
    );
  }

  // Step 1 -> Step 2
  if (step1NextBtn) {
    step1NextBtn.addEventListener('click', () => {
      calculatePrice();
      goToStep(2);
    });
  }

  // Step 2 -> Step 1
  if (step2BackBtn) {
    step2BackBtn.addEventListener('click', () => goToStep(1));
  }

  // Step 2 -> Step 3
  if (step2NextBtn) {
    step2NextBtn.addEventListener('click', () => goToStep(3));
  }

  // Step 3 -> Step 2
  if (step3BackBtn) {
    step3BackBtn.addEventListener('click', () => goToStep(2));
  }

  /* ── Form Validation & Submission ── */
  if (confirmForm) {
    confirmForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;
      const nameVal = nameInput ? nameInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';

      const nameGroup = nameInput?.closest('.form-group');
      const emailGroup = emailInput?.closest('.form-group');

      // Validate name
      if (!nameVal) {
        valid = false;
        nameGroup?.classList.add('has-error');
      } else {
        nameGroup?.classList.remove('has-error');
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        valid = false;
        emailGroup?.classList.add('has-error');
      } else {
        emailGroup?.classList.remove('has-error');
      }

      if (!valid) return;

      // Start 1.2s loading state
      step3SubmitBtn.disabled = true;
      const originalText = step3SubmitBtn.innerHTML;
      step3SubmitBtn.innerHTML = `
        <span style="display:inline-block;animation:spin 0.8s linear infinite;margin-right:6px;">✦</span> Reserving...
      `;

      setTimeout(() => {
        // Generate booking reference ME-2610-{4 chars}
        const randChars = Math.random().toString(36).substring(2, 6).toUpperCase();
        state.bookingRef = `ME-2610-${randChars}`;

        showSuccessScreen(nameVal);
      }, 1200);
    });
  }

  function showSuccessScreen(guestName) {
    const step3 = card.querySelector('#booking-step-3');
    if (confirmForm) confirmForm.style.display = 'none';
    if (step3BackBtn) step3BackBtn.style.display = 'none';

    if (successScreen) {
      successScreen.classList.add('is-visible');

      const firstName = guestName.split(' ')[0] || 'Friend';
      if (successNameEl) successNameEl.textContent = `Merci, ${firstName}.`;
      if (successRefEl)  successRefEl.textContent = `Reference: ${state.bookingRef}`;

      // Populate summary details
      const suite = SUITES[state.suiteIndex];
      const checkInStr = state.checkIn ? state.checkIn.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
      const checkOutStr = state.checkOut ? state.checkOut.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

      if (successSummary) {
        successSummary.innerHTML = `
          <div class="success-line"><span>Suite</span><strong>${suite.name}</strong></div>
          <div class="success-line"><span>Dates</span><strong>${checkInStr} – ${checkOutStr} (${state.nights} nights)</strong></div>
          <div class="success-line"><span>Guests</span><strong>${state.guests}</strong></div>
          <div class="success-line"><span>Total</span><strong>€${state.lastCalculatedTotal?.toLocaleString()}</strong></div>
        `;
      }

      // Animate SVG checkmark drawing
      const checkPath = successScreen.querySelector('.success-check-mark');
      if (checkPath) {
        gsap.fromTo(checkPath,
          { strokeDashoffset: 48 },
          { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.2 }
        );
      }

      // Height adjustment
      gsap.to(card, {
        height: 'auto',
        duration: 0.4,
        onComplete: () => ScrollTrigger.refresh()
      });
    }
  }

  // Reset / Start Over
  if (startOverBtn) {
    startOverBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Reset state
      state.step = 1;
      state.checkIn = null;
      state.checkOut = null;
      state.nights = 0;
      state.guests = 2;
      state.suiteIndex = 0;
      state.addons.breakfast = false;
      state.addons.transfer = false;

      // Reset DOM elements
      if (confirmForm) confirmForm.style.display = 'flex';
      if (step3BackBtn) step3BackBtn.style.display = '';
      if (successScreen) successScreen.classList.remove('is-visible');
      if (step3SubmitBtn) {
        step3SubmitBtn.disabled = false;
        step3SubmitBtn.innerHTML = 'Confirm reservation ↗';
      }

      // Reset chips & suite cards
      suiteCards.forEach((c, i) => c.classList.toggle('is-selected', i === 0));
      addonChips.forEach(c => c.classList.remove('is-active'));

      renderCalendar();
      updateNightsDisplay();
      updateGuests();
      updateStep1Button();

      stepElements.forEach((el, i) => {
        el.classList.toggle('is-active', i === 0);
        el.style.display = i === 0 ? 'block' : 'none';
        gsap.set(el, { x: 0, opacity: i === 0 ? 1 : 0 });
      });

      stepNavItems.forEach((item, i) => {
        item.classList.toggle('is-active', i === 0);
        item.classList.remove('is-completed');
      });

      if (progressFill) progressFill.style.width = '33.333%';

      card.style.height = 'auto';
      ScrollTrigger.refresh();
    });
  }

  return {
    selectSuiteAndOpen(suiteIdx) {
      selectSuite(suiteIdx);
      goToStep(2);
    }
  };
}

/* ─────────────────────────────────────────────
   Wire Reserve Triggers & Custom Event
   ───────────────────────────────────────────── */
function wireReserveTriggers(lenis, bookingWidget) {
  const reserveTarget = document.getElementById('reserve');
  if (!reserveTarget || !lenis) return;

  function scrollToReserve() {
    lenis.scrollTo(reserveTarget, {
      offset: -96,
      duration: 1.4,
      easing: expoInOut,
    });
  }

  // 1. Existing Nav "Reserve" pill and any other reserve triggers
  document.querySelectorAll('a[href="#reserve"], .nav__reserve').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // If it's a suite reserve button, handled separately below with custom event
      if (!btn.classList.contains('suites__reserve-btn')) {
        e.preventDefault();
        scrollToReserve();
      }
    });
  });

  // 2. Hero search button in bottom bar
  const heroSearchBtns = document.querySelectorAll('.bar__search-btn, .booking-btn');
  heroSearchBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToReserve();
    });
  });

  // 3. Suite "Reserve this suite" buttons
  document.querySelectorAll('.suites__reserve-btn').forEach((btn, idx) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      // Suite index 0, 1, or 2 based on panel or DOM index % 3
      const suiteIdx = idx % 3;

      // Dispatch custom event as requested:
      // "the suite buttons also preselect that suite in step 2 (use a custom event, not a global)."
      window.dispatchEvent(new CustomEvent('maison:select-suite', {
        detail: { suiteIndex: suiteIdx }
      }));

      scrollToReserve();
    });
  });

  // Listen to the custom event
  window.addEventListener('maison:select-suite', (e) => {
    const { suiteIndex } = e.detail;
    if (bookingWidget && typeof suiteIndex === 'number') {
      bookingWidget.selectSuiteAndOpen(suiteIndex);
    }
  });
}

/* ─────────────────────────────────────────────
   Refresh Helper
   ───────────────────────────────────────────── */
function scheduleRefresh(section) {
  ScrollTrigger.refresh();
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

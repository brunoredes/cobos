/**
 * main.js — Entry point (ES Module)
 *
 * Wires countdown + splash logic to the DOM.
 * All DOM mutations and timer side effects are isolated here.
 *
 * Architecture:
 *   countdown.js  →  pure functions, no DOM
 *   splash.js     →  pure selector + HOF controller
 *   main.js       →  orchestrates side effects only
 */

'use strict';

import {
  TARGET,
  computeRemaining,
  formatCountdown,
  formatTargetDate,
  buildSrAnnouncement,
  createTicker,
} from './countdown.js';

import { selectSplashImage, createSplashController } from './splash.js';
import { createThemeController } from './theme.js';

// -------------------------------------------------------------------------
// DOM references (read once at module evaluation time)
// -------------------------------------------------------------------------

const splashEl    = /** @type {HTMLDivElement}     */ (document.getElementById('splash'));
const splashImgEl = /** @type {HTMLImageElement}   */ (document.getElementById('splash-image'));
const mainEl      = /** @type {HTMLElement}        */ (document.getElementById('main'));
const daysEl      = /** @type {HTMLElement}        */ (document.getElementById('days'));
const hoursEl     = /** @type {HTMLElement}        */ (document.getElementById('hours'));
const minutesEl   = /** @type {HTMLElement}        */ (document.getElementById('minutes'));
const secondsEl   = /** @type {HTMLElement}        */ (document.getElementById('seconds'));
const targetDateEl = /** @type {HTMLElement}       */ (document.getElementById('target-date'));
const srAnnounceEl = /** @type {HTMLElement}       */ (document.getElementById('sr-announce'));
const themeFabEl   = /** @type {HTMLButtonElement} */ (document.getElementById('theme-fab'));

// -------------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------------

const SPLASH_VISIBLE_MS  = 3_000; // how long splash stays fully visible
const SR_ANNOUNCE_EVERY  = 60;    // announce to screen readers every N seconds

// -------------------------------------------------------------------------
// Theme — side effects (init before splash so first paint has correct theme)
// -------------------------------------------------------------------------

const theme = createThemeController(document.documentElement, themeFabEl, localStorage);
theme.init();
themeFabEl.addEventListener('click', theme.toggle);

// -------------------------------------------------------------------------
// Splash — side effects
// -------------------------------------------------------------------------

const splash   = createSplashController(splashEl, splashImgEl);
const imageUrl = selectSplashImage(TARGET, new Date(), import.meta.env?.BASE_URL ?? '/');

splash.mount(imageUrl);
splash.dismiss(SPLASH_VISIBLE_MS);

// Reveal main content after the splash transition completes.
// The CSS transition for splash is 900 ms; add a small overlap buffer.
setTimeout(() => {
  mainEl.classList.add('main--visible');
}, SPLASH_VISIBLE_MS + 300);

// -------------------------------------------------------------------------
// Target date label — side effect (one-time)
// -------------------------------------------------------------------------

targetDateEl.textContent = formatTargetDate(TARGET);

// -------------------------------------------------------------------------
// Countdown render — side effects
// -------------------------------------------------------------------------

/**
 * Write formatted countdown values into the DOM.
 * Called once on load and then every second by the ticker.
 * Pure DOM write — no external dependencies.
 *
 * @param {import('./countdown.js').Remaining} remaining
 * @param {import('./countdown.js').FormattedCountdown} formatted
 */
const renderCountdown = (remaining, formatted) => {
  daysEl.textContent    = formatted.days;
  hoursEl.textContent   = formatted.hours;
  minutesEl.textContent = formatted.minutes;
  secondsEl.textContent = formatted.seconds;
};

/**
 * Update the SR live region every SR_ANNOUNCE_EVERY seconds.
 * Avoids flooding screen readers with per-second updates.
 *
 * @param {import('./countdown.js').Remaining} remaining
 */
const renderSrAnnounce = (remaining) => {
  if (remaining.seconds % SR_ANNOUNCE_EVERY === 0) {
    srAnnounceEl.textContent = buildSrAnnouncement(remaining);
  }
};

/**
 * stopTicker is declared as `let` so it is in scope when `tick` references it,
 * even though the actual cleanup function is assigned after `createTicker` runs.
 * Initialised to a no-op so a premature call (e.g. already-expired on first
 * render) is harmless.
 *
 * @type {() => void}
 */
let stopTicker = () => {};

/** Single tick: compute → format → render (pure pipeline + one DOM write) */
const tick = () => {
  const remaining = computeRemaining(TARGET, new Date());
  const formatted = formatCountdown(remaining);

  renderCountdown(remaining, formatted);
  renderSrAnnounce(remaining);

  // Stop the ticker once the countdown has expired.
  if (remaining.expired) stopTicker();
};

// Initial render before first tick fires (avoids 1-second blank flash).
tick();

// Assign the real cleanup function; any subsequent expired check in tick()
// will now correctly clear the interval.
stopTicker = createTicker(tick, 1_000);

// -------------------------------------------------------------------------
// Cleanup — stop interval when page is unloaded / enters bfcache
// -------------------------------------------------------------------------
window.addEventListener('pagehide', stopTicker, { once: true });

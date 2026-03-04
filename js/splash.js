/**
 * splash.js
 *
 * Logic for the splash intro overlay.
 *
 * Pure functions:
 *   - selectSplashImage  — decides which asset to show.
 *
 * Side-effect factories (HOF):
 *   - createSplashController — wraps DOM mutations behind a frozen interface.
 */

'use strict';

// -------------------------------------------------------------------------
// Pure helpers
// -------------------------------------------------------------------------

/**
 * Select the correct splash image path based on current time.
 *
 * Before 2026-03-10T11:00:00Z (08:00 BRT) → <base>images/guaco.avif
 * On or after                              → <base>images/fit.avif
 *
 * `base` mirrors Vite's `import.meta.env.BASE_URL` so the path is correct
 * both on localhost ("/") and on GitHub Pages ("/cobos/").
 * The caller (main.js) is responsible for supplying it — keeps this module
 * free of any build-tool globals.
 *
 * @param {Date}   target  Launch target date (UTC).
 * @param {Date}   now     Current date/time.
 * @param {string} [base='/'] Vite base URL (trailing slash required).
 * @returns {string}     Absolute path to the image asset.
 */
export const selectSplashImage = (target, now, base = '/') =>
  now.getTime() < target.getTime()
    ? `${base}images/guaco.avif`
    : `${base}images/fit.avif`;

// -------------------------------------------------------------------------
// Side-effect factory
// -------------------------------------------------------------------------

/**
 * HOF: Create a controller object that encapsulates splash DOM mutations.
 * All DOM side effects are isolated here; the rest of the app stays pure.
 *
 * @param {HTMLElement}     splashEl  The `.splash` overlay element.
 * @param {HTMLImageElement} imgEl    The `<img>` inside the splash.
 * @returns {Readonly<{ mount: (src: string) => void, dismiss: (delay?: number) => void }>}
 */
export const createSplashController = (splashEl, imgEl) => {
  /**
   * Set the splash image source and make the overlay visible.
   * (The overlay is already visible by default via CSS; this just
   *  wires the correct asset before the first paint.)
   *
   * @param {string} src
   */
  const mount = (src) => {
    imgEl.src = src;
  };

  /**
   * Fade-out and visually hide the splash after `delay` ms.
   * Adds `.splash--hidden` which CSS transitions to opacity:0 / visibility:hidden.
   *
   * @param {number} [delay=3000]  Time in ms before the transition starts.
   */
  const dismiss = (delay = 3_000) => {
    setTimeout(() => {
      splashEl.classList.add('splash--hidden');
    }, delay);
  };

  return Object.freeze({ mount, dismiss });
};

/**
 * theme.js
 *
 * Pure functions for theme management + HOF controller.
 * No DOM reads inside pure functions; side effects isolated to the controller.
 */

'use strict';

// -------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------

/** @typedef {'dark' | 'light'} Theme */

const STORAGE_KEY = 'cobos-theme';

const THEMES = Object.freeze(/** @type {const} */ ({
  DARK:  'dark',
  LIGHT: 'light',
}));

// -------------------------------------------------------------------------
// Pure functions
// -------------------------------------------------------------------------

/**
 * Resolve the initial theme from, in priority order:
 *   1. Persisted user preference (localStorage)
 *   2. OS colour-scheme preference
 *   3. Fallback: dark
 *
 * @param {Storage}     storage
 * @param {MediaQueryList} prefersLight
 * @returns {Theme}
 */
export const resolveInitialTheme = (storage, prefersLight) => {
  const persisted = storage.getItem(STORAGE_KEY);
  if (persisted === THEMES.DARK || persisted === THEMES.LIGHT) return persisted;
  return prefersLight.matches ? THEMES.LIGHT : THEMES.DARK;
};

/**
 * Return the opposite theme.
 *
 * @param {Theme} current
 * @returns {Theme}
 */
export const toggleTheme = (current) =>
  current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;

/**
 * Return the emoji that represents the *action* the button will perform.
 * Dark mode  → show ☀️  (click to switch to light)
 * Light mode → show 🌙  (click to switch to dark)
 *
 * @param {Theme} current
 * @returns {string}
 */
export const themeEmoji = (current) =>
  current === THEMES.DARK ? '☀️' : '🌙';

/**
 * Return the accessible label for the toggle button.
 *
 * @param {Theme} current
 * @returns {string}
 */
export const themeLabel = (current) =>
  current === THEMES.DARK
    ? 'Mudar para tema claro'
    : 'Mudar para tema escuro';

// -------------------------------------------------------------------------
// Side-effect factory (HOF)
// -------------------------------------------------------------------------

/**
 * HOF: Create a controller that owns all theme-related side effects.
 *
 * @param {HTMLElement}    rootEl    Element that receives `data-theme` (usually `<html>`).
 * @param {HTMLElement}    buttonEl  The FAB toggle button.
 * @param {Storage}        storage   Persistence layer (usually `localStorage`).
 * @returns {Readonly<{ init: () => void, toggle: () => void }>}
 */
export const createThemeController = (rootEl, buttonEl, storage) => {
  /** @type {Theme} */
  let current = THEMES.DARK;

  /** Apply a theme to the DOM and persist it. */
  const apply = (theme) => {
    current = theme;
    rootEl.dataset.theme = theme;
    buttonEl.textContent = themeEmoji(theme);
    buttonEl.setAttribute('aria-label', themeLabel(theme));
    storage.setItem(STORAGE_KEY, theme);
  };

  const init = () => {
    const initial = resolveInitialTheme(
      storage,
      window.matchMedia('(prefers-color-scheme: light)'),
    );
    apply(initial);
  };

  const toggle = () => apply(toggleTheme(current));

  return Object.freeze({ init, toggle });
};

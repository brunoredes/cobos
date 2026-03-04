/**
 * countdown.js
 *
 * Pure functions for countdown computation and formatting.
 * No DOM interaction, no side effects — safe to test in isolation.
 */

'use strict';

// -------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------

/**
 * Launch target: 10 March 2026, 08:00 BRT (UTC-3) = 11:00 UTC.
 * @type {Readonly<Date>}
 */
export const TARGET = Object.freeze(new Date('2026-03-10T11:00:00.000Z'));

// -------------------------------------------------------------------------
// Types (JSDoc)
// -------------------------------------------------------------------------

/**
 * @typedef {{ days: number, hours: number, minutes: number, seconds: number, expired: boolean }} Remaining
 */

/**
 * @typedef {{ days: string, hours: string, minutes: string, seconds: string }} FormattedCountdown
 */

// -------------------------------------------------------------------------
// Pure functions
// -------------------------------------------------------------------------

/**
 * Compute time remaining between `now` and `target`.
 * Returns an expired snapshot when `now >= target`.
 *
 * @param {Date} target
 * @param {Date} now
 * @returns {Readonly<Remaining>}
 */
export const computeRemaining = (target, now) => {
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return Object.freeze({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86_400);
  const hours   = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return Object.freeze({ days, hours, minutes, seconds, expired: false });
};

/**
 * Format a single numeric unit with zero-padding via Intl.NumberFormat.
 *
 * @param {number} value
 * @returns {string}
 */
export const formatSegment = (value) =>
  new Intl.NumberFormat('pt-BR', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(value);

/**
 * Map a Remaining snapshot to display strings for each segment.
 *
 * @param {Remaining} remaining
 * @returns {Readonly<FormattedCountdown>}
 */
export const formatCountdown = (remaining) =>
  Object.freeze({
    days:    formatSegment(remaining.days),
    hours:   formatSegment(remaining.hours),
    minutes: formatSegment(remaining.minutes),
    seconds: formatSegment(remaining.seconds),
  });

/**
 * Format the target launch date for human display using Intl.DateTimeFormat.
 * Renders in BRT (UTC-3) regardless of the visitor's local timezone.
 *
 * @param {Date} date
 * @returns {string}
 */
export const formatTargetDate = (date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day:          '2-digit',
    month:        'long',
    year:         'numeric',
    hour:         '2-digit',
    minute:       '2-digit',
    timeZone:     'America/Sao_Paulo', // BRT = UTC-3
    timeZoneName: 'short',
  }).format(date);

/**
 * Build a human-readable accessibility announcement for the current remaining time.
 * Called at most once per minute to avoid flooding screen readers.
 *
 * @param {Remaining} remaining
 * @returns {string}
 */
export const buildSrAnnouncement = (remaining) => {
  if (remaining.expired) return 'O lançamento já ocorreu.';

  const parts = [
    remaining.days    > 0 ? `${remaining.days} dia${remaining.days !== 1 ? 's' : ''}` : null,
    remaining.hours   > 0 ? `${remaining.hours} hora${remaining.hours !== 1 ? 's' : ''}` : null,
    remaining.minutes > 0 ? `${remaining.minutes} minuto${remaining.minutes !== 1 ? 's' : ''}` : null,
  ].filter(Boolean);

  return `Faltam ${parts.join(', ')} para o lançamento.`;
};

// -------------------------------------------------------------------------
// HOF — ticker (only side effect here: setInterval / clearInterval)
// -------------------------------------------------------------------------

/**
 * HOF: Start a recurring tick and return a cleanup function.
 * Callers are responsible for calling the cleanup to stop the timer.
 *
 * @param {() => void} onTick   Callback invoked at each interval.
 * @param {number}     interval Interval in milliseconds (default 1000).
 * @returns {() => void}        Cleanup / stop function.
 */
export const createTicker = (onTick, interval = 1_000) => {
  const id = setInterval(onTick, interval);
  return () => clearInterval(id);
};

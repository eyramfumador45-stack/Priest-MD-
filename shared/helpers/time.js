/**
 * shared/helpers/time.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Time & date formatting helpers.
 * -----------------------------------------------------------------------------
 */

'use strict';

/**
 * Pad a number with leading zeros.
 * @param {number} n
 * @param {number} len
 */
function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

/** ISO-ish local timestamp string. */
function timestamp(date = new Date()) {
  return date.toISOString();
}

/** Human readable timestamp. */
function humanTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Full human date-time. */
function humanDateTime(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${humanTime(date)}`;
}

/**
 * Format a millisecond duration into a human readable string.
 * e.g. 90061000 -> "1d 1h 1m 1s"
 * @param {number} ms
 */
function duration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (sec || !parts.length) parts.push(`${sec}s`);
  return parts.join(' ');
}

/** Sleep helper. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Unix timestamp (seconds). */
function unix(date = new Date()) {
  return Math.floor(date.getTime() / 1000);
}

module.exports = {
  pad,
  timestamp,
  humanTime,
  humanDateTime,
  duration,
  sleep,
  unix,
};

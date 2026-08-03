/**
 * shared/helpers/format.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Formatting helpers (numbers, sizes, text truncation, escape).
 * -----------------------------------------------------------------------------
 */

'use strict';

/** Format a number with thousands separators. */
function number(value) {
  return Number(value || 0).toLocaleString('en-US');
}

/** Format bytes into a human readable size. */
function bytes(value) {
  const n = Number(value || 0);
  if (n === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 2 : 0)} ${units[i]}`;
}

/** Truncate a string and add ellipsis. */
function truncate(text, max = 50) {
  const s = String(text || '');
  if (s.length <= max) return s;
  return `${s.slice(0, max - 3)}...`;
}

/** Uppercase first letter. */
function capitalize(text) {
  const s = String(text || '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Escape text for use inside a Telegram HTML message. */
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape text for use inside a Telegram MarkdownV2 message. */
function escapeMarkdown(text) {
  return String(text || '').replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/** Split long text into chunks <= maxLength at line boundaries. */
function chunk(text, maxLength = 4096) {
  const s = String(text || '');
  if (s.length <= maxLength) return [s];
  const lines = s.split('\n');
  const out = [];
  let cur = '';
  for (const line of lines) {
    if (cur.length + line.length + 1 > maxLength) {
      out.push(cur);
      cur = line;
    } else {
      cur = cur ? `${cur}\n${line}` : line;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Percentage bar for dashboards. */
function bar(percent, width = 10) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const filled = Math.round((p / 100) * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)} ${p.toFixed(0)}%`;
}

module.exports = {
  number,
  bytes,
  truncate,
  capitalize,
  escapeHtml,
  escapeMarkdown,
  chunk,
  bar,
};

/**
 * shared/utils/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Barrel export for shared utilities.
 * -----------------------------------------------------------------------------
 */

'use strict';

const safe = require('./safe');

/** Generic, reusable utility functions. */
const util = {
  safe,
  /**
   * Get a safely nested value from an object using a dot-path.
   * @param {object} obj
   * @param {string} path e.g. "a.b.c"
   */
  get(obj, path, fallback) {
    const parts = String(path || '').split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return fallback;
      cur = cur[p];
    }
    return cur === undefined ? fallback : cur;
  },
  /**
   * Pick a random element from an array.
   */
  random(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  },
  /**
   * Parse command args respecting quotes: `"two words"` stays one token.
   */
  parseArgs(text) {
    const s = String(text || '').trim();
    const tokens = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      tokens.push(m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]));
    }
    return tokens;
  },
};

module.exports = util;
module.exports.safe = safe;

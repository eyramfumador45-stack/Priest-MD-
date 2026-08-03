/**
 * shared/utils/safe.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Safe-execution wrappers: one broken module must never crash the framework.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../logger');

/**
 * Run an async function, swallow & log errors, return a fallback.
 * @param {Function} fn async function
 * @param {*} fallback value to return on error
 * @param {string} label context label for logs
 */
async function safe(fn, fallback = null, label = 'safe') {
  try {
    return await fn();
  } catch (err) {
    logger.warn(`[${label}] caught error`, { error: err.message, stack: err.stack });
    return fallback;
  }
}

/**
 * Wrap a promise; never reject. Resolves to [err, result].
 * @param {Promise|Function} p promise or function returning a promise
 */
async function attempt(p) {
  try {
    const result = await (typeof p === 'function' ? p() : p);
    return [null, result];
  } catch (err) {
    return [err, undefined];
  }
}

/** Synchronous safe JSON parse. */
function tryParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return fallback;
  }
}

/** Deep clone via structuredClone with a JSON fallback. */
function deepClone(value) {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value); } catch (e) { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  safe,
  attempt,
  tryParse,
  deepClone,
};

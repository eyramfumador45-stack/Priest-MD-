/**
 * services/whatsapp/middleware/rate-limiter.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Simple sliding-window rate limiter to protect against command flooding.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = function rateLimiterMiddleware({ windowMs = 15000, max = 20 } = {}) {
  const hits = new Map();

  return async function rateLimiter(ctx, next) {
    if (!ctx.isCommand) return next();
    const key = ctx.senderNumber;
    const now = Date.now();

    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(key, arr);
    if (hits.size > 5000) hits.clear();

    if (arr.length > max) {
      ctx._handled = true;
      await ctx.reply({
        text: `🚫 Rate limit exceeded. Please slow down (*${max} commands/${windowMs / 1000}s*).`,
      });
      return;
    }
    return next();
  };
};

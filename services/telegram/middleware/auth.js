/**
 * services/telegram/middleware/auth.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Telegram authentication: only configured admins (or owners) may control the
 * bot. Optionally allows specific whitelisted users read-only access.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');

/**
 * Build a Telegraf middleware that restricts the control panel to admins.
 * @param {object} deps { config, onDenied }
 */
function adminAuth({ config, onDenied }) {
  return async (ctx, next) => {
    const from = ctx.from;
    if (!from) return;
    const id = String(from.id);
    const username = from.username;

    const adminList = [
      ...(config.telegram.admins || []),
      ...(config.owner || []),
    ].map((s) => String(s));

    // Allow admins by numeric id, numeric string, or username.
    const allowed = adminList.some((a) => {
      const a2 = a.replace(/^@/, '');
      return a === id || a2 === id || (username && a2 === `@${username}`) || (username && a2.toLowerCase() === username.toLowerCase());
    });

    if (!allowed) {
      logger.warn('[telegram] blocked unauthorised user', { id, username });
      if (onDenied) {
        await onDenied(ctx);
      } else {
        await ctx.reply('⛔ *Access denied.*\n\nYou are not authorised to control this bot.').catch(() => {});
      }
      return;
    }
    ctx.isAdmin = true;
    return next();
  };
}

/** Simple cooldown to prevent spam on Telegram. */
function rateLimit({ windowMs = 3000 } = {}) {
  const last = new Map();
  return async (ctx, next) => {
    const key = String(ctx.from?.id || 'anon');
    const now = Date.now();
    const prev = last.get(key) || 0;
    if (now - prev < windowMs) {
      await ctx.reply('⏳ Please wait a moment before sending another command.').catch(() => {});
      return;
    }
    last.set(key, now);
    return next();
  };
}

module.exports = { adminAuth, rateLimit };

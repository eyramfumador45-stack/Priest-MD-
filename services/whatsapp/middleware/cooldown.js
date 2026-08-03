/**
 * services/whatsapp/middleware/cooldown.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Per-command cooldown enforcement (in-memory, persists per command metadata).
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = function cooldownMiddleware() {
  const lastUsed = new Map();

  return async function cooldown(ctx, next) {
    if (!ctx.isCommand || !ctx.command) return next();

    const cooldownMs = ctx.command.cooldown || ctx.config.cooldowns.default || 5000;
    if (!cooldownMs) return next();

    const key = `${ctx.senderNumber}:${ctx.commandName}`;
    const now = Date.now();
    const last = lastUsed.get(key);

    if (last && now - last < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - last)) / 1000);
      ctx._handled = true;
      await ctx.reply({
        text: `⏳ Please wait *${remaining}s* before using *${ctx.commandName}* again.`,
      });
      return;
    }

    lastUsed.set(key, now);
    // Prevent unbounded growth.
    if (lastUsed.size > 10000) lastUsed.clear();

    return next();
  };
};

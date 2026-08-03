/**
 * services/telegram/commands/restart.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /restart <number> — Restart a WhatsApp session without re-pairing.
 * -----------------------------------------------------------------------------
 */

'use strict';

const helpers = require('../../../shared/helpers');

module.exports = {
  name: 'restart',
  description: 'Restart a session',
  aliases: ['reboot'],
  handler: async (ctx, deps) => {
    const raw = (ctx.message?.text || '').split(' ').slice(1).join(' ').trim();
    if (!raw) {
      await ctx.reply('Usage: `/restart <number>`\nExample: `/restart 233241234567`');
      return;
    }
    const number = helpers.phone.normalizePhone(raw);
    if (!deps.sessionManager.has(number)) {
      await ctx.reply(`❌ No active session for *${number}*.`);
      return;
    }
    await deps.sessionManager.stop(number);
    await deps.sessionManager.create(number);
    await ctx.reply(`🔄 Session *${number}* is restarting.`);
  },
};

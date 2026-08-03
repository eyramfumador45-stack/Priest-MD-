/**
 * services/telegram/commands/pair.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /pair — Begin the WhatsApp pairing flow.
 * -----------------------------------------------------------------------------
 */

'use strict';

const pairing = require('../pairing');

module.exports = {
  name: 'pair',
  description: 'Pair a new WhatsApp number',
  aliases: ['add', 'link'],
  handler: async (ctx, deps) => {
    if (deps.config.telegram.allowPairing === false) {
      await ctx.reply('⛔ Pairing is currently disabled.');
      return;
    }
    await pairing.startPairing(ctx, deps.telegramBot);
  },
};

/**
 * services/telegram/commands/shutdown.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /shutdown — Gracefully shut down the entire framework.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'shutdown',
  description: 'Shut down the bot',
  aliases: ['halt', 'quit'],
  handler: async (ctx, deps) => {
    await ctx.reply('⏻ Shutting down *Priest MD* gracefully...');
    if (typeof deps.shutdown === 'function') {
      // Small delay so the reply is sent first.
      setTimeout(() => deps.shutdown(), 500);
    }
  },
};

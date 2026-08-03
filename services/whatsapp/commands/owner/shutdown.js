/**
 * commands/owner/shutdown.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .shutdown — gracefully shut down the whole framework.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'shutdown',
  description: 'Gracefully shut down the bot',
  aliases: ['kill', 'halt'],
  category: 'owner',
  usage: '.shutdown',
  owner: true,
  cooldown: 30000,
  execute: async (ctx) => {
    await ctx.reply({ text: '⏻ Shutting down *Priest MD*...' });
    setTimeout(() => {
      // eslint-disable-next-line global-require
      require('../../../../index').shutdown('whatsapp-command');
    }, 500);
  },
};

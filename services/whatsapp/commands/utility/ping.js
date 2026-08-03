/**
 * commands/utility/ping.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .ping — latency check.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'ping',
  description: 'Check bot latency',
  aliases: ['p'],
  category: 'utility',
  usage: '.ping',
  cooldown: 5000,
  execute: async (ctx) => {
    const start = Date.now();
    await ctx.reply({ text: '🏓 Pong!' });
    const ms = Date.now() - start;
    await ctx.reply({ text: `⚡ Response time: *${ms}ms*` });
  },
};

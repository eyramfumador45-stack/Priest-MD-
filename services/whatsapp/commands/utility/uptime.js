/**
 * commands/utility/uptime.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .uptime — how long the bot has been running.
 * -----------------------------------------------------------------------------
 */

'use strict';

const helpers = require('../../../../shared/helpers');

module.exports = {
  name: 'uptime',
  description: 'Show bot uptime',
  aliases: ['up'],
  category: 'utility',
  usage: '.uptime',
  cooldown: 5000,
  execute: async (ctx) => {
    const up = process.uptime() * 1000;
    await ctx.reply({ text: `⏱️ Bot uptime: *${helpers.time.duration(up)}*` });
  },
};

/**
 * commands/utility/stats.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .stats — framework statistics (RAM, commands, sessions, db state).
 * -----------------------------------------------------------------------------
 */

'use strict';

const helpers = require('../../../../shared/helpers');
const registry = require('../index');

module.exports = {
  name: 'stats',
  description: 'Show bot statistics',
  aliases: ['stat', 'status'],
  category: 'utility',
  usage: '.stats',
  cooldown: 5000,
  execute: async (ctx) => {
    const mem = process.memoryUsage();
    const lines = [
      '📊 *Priest MD — Statistics*\n',
      `• Commands loaded: *${registry.list().length}*`,
      `• MongoDB: *${ctx.session && require('../../../../database').isConnected() ? 'connected' : 'degraded'}*`,
      `• RAM used: *${helpers.format.bytes(mem.rss)}*`,
      `• Heap: *${helpers.format.bytes(mem.heapUsed)}*`,
      `• Uptime: *${helpers.time.duration(process.uptime() * 1000)}*`,
      `• Node: *${process.version}*`,
    ];
    await ctx.reply({ text: lines.join('\n') });
  },
};

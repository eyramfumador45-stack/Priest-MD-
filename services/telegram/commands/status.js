/**
 * services/telegram/commands/status.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /status — Overall system health (sessions, db, uptime, memory).
 * -----------------------------------------------------------------------------
 */

'use strict';

const helpers = require('../../../shared/helpers');
const config = require('../../../config/config');
const { isConnected } = require('../../../database');

module.exports = {
  name: 'status',
  description: 'Overall system status',
  aliases: ['health'],
  handler: async (ctx, deps) => {
    const sessions = deps.sessionManager.list();
    const online = sessions.filter((s) => s.status === 'online').length;
    const mem = process.memoryUsage();
    const uptime = process.uptime() * 1000;

    const lines = [
      '📈 *System Status*\n',
      `*${config.bot.name}* — ${config.branding.officialBranding}\n`,
      `• Sessions: *${sessions.length}* (${online} online)`,
      `• MongoDB: *${isConnected() ? 'connected' : 'degraded'}*`,
      `• Uptime: *${helpers.time.duration(uptime)}*`,
      `• RAM: *${helpers.format.bytes(mem.rss)}* used`,
      `• Node: *${process.version}*`,
    ];
    await ctx.reply(lines.join('\n'));
  },
};

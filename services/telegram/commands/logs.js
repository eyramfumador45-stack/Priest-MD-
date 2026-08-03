/**
 * services/telegram/commands/logs.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /logs — Show recent application log lines.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', '..', 'logs');

module.exports = {
  name: 'logs',
  description: 'View recent logs',
  aliases: ['log'],
  handler: async (ctx) => {
    const file = path.join(LOG_DIR, 'info.log');
    if (!fs.existsSync(file)) {
      await ctx.reply('No log file found yet.');
      return;
    }
    const lines = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter(Boolean)
      .slice(-25);
    const text = ['📜 *Recent Logs*\n', ...lines].join('\n');
    // Telegram message limit ~4096 chars.
    await ctx.reply(text.slice(0, 4000));
  },
};

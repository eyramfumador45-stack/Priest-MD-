/**
 * services/telegram/commands/menu.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /menu — Interactive inline menu of the control panel.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');

module.exports = {
  name: 'menu',
  description: 'Interactive menu',
  aliases: ['panel'],
  handler: async (ctx) => {
    await ctx.reply('📋 *Priest MD — Menu*\n\nChoose an option:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Dashboard', callback_data: 'menu:dashboard' },
            { text: '📱 Pair New', callback_data: 'menu:pair' },
          ],
          [
            { text: '🔄 Sessions', callback_data: 'menu:sessions' },
            { text: '📈 Status', callback_data: 'menu:status' },
          ],
          [
            { text: '🧩 Plugins', callback_data: 'menu:plugins' },
            { text: '📜 Logs', callback_data: 'menu:logs' },
          ],
          [{ text: 'ℹ️ About', callback_data: 'menu:about' }],
        ],
      },
    });
  },
};

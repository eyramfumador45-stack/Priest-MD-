/**
 * services/telegram/plugins/sample-plugin.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Sample Telegram control-panel plugin. Adds a /ping command without editing
 * core code.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'telegram-sample-plugin',
  version: '1.0.0',
  description: 'Adds a /ping command to the control panel.',
  install(api) {
    api.command('ping', async (ctx) => {
      await ctx.reply('🏓 Pong! The control panel is alive.');
    });
  },
};

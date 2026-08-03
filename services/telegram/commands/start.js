/**
 * services/telegram/commands/start.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /start — Welcome message and pointer to the control panel.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');

module.exports = {
  name: 'start',
  description: 'Welcome message',
  handler: async (ctx) => {
    const name = ctx.from?.first_name || 'there';
    await ctx.reply(
      `👋 *Hello, ${name}!*\n\n` +
        `Welcome to the *Priest MD* control panel.\n\n` +
        `${config.branding.officialBranding}\n\n` +
        `Here you can manage your WhatsApp Multi-Device sessions.\n\n` +
        `• /pair — Link a new WhatsApp number\n` +
        `• /sessions — View active sessions\n` +
        `• /status — Overall system status\n` +
        `• /menu — Full menu\n\n` +
        `Type /help for all commands.`
    );
  },
};

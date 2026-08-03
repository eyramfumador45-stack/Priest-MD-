/**
 * services/telegram/commands/about.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /about — Framework information and branding.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');
const branding = config.branding;

module.exports = {
  name: 'about',
  description: 'About Priest MD',
  handler: async (ctx) => {
    await ctx.reply(
      `🤖 *${branding.name}*\n\n` +
        `*Developer:* ${branding.developer}\n` +
        `*Version:* ${config.bot.version || branding.version}\n` +
        `*Platform:* WhatsApp Multi-Device\n` +
        `*Type:* Modular bot framework with Telegram control panel\n\n` +
        `${branding.officialBranding}`
    );
  },
};

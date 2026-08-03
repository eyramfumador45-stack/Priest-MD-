/**
 * commands/utility/about.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .about — framework information and official branding.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../../config/config');

module.exports = {
  name: 'about',
  description: 'About Priest MD',
  aliases: ['info'],
  category: 'utility',
  usage: '.about',
  cooldown: 5000,
  execute: async (ctx) => {
    await ctx.reply({
      text: `🤖 *${config.bot.name}*\n\n` +
        `*Developer:* ${config.branding.developer}\n` +
        `*Version:* ${config.bot.version}\n` +
        `*Type:* WhatsApp Multi-Device bot framework\n\n` +
        `${config.branding.officialBranding}`,
    });
  },
};

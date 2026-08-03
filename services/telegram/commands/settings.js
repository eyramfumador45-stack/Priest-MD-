/**
 * services/telegram/commands/settings.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /settings — Show a summary of the current configuration.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'settings',
  description: 'View current settings',
  aliases: ['config'],
  handler: async (ctx, deps) => {
    const c = deps.config;
    const lines = [
      '⚙️ *Settings*\n',
      `• Prefixes: \`${(c.bot.prefixes || []).join(', ')}\``,
      `• Maintenance: *${c.bot.maintenance ? 'ON' : 'OFF'}*`,
      `• Telegram pairing: *${c.telegram.allowPairing ? 'enabled' : 'disabled'}*`,
      `• WhatsApp auto-reconnect: *${c.whatsapp.autoReconnect ? 'on' : 'off'}*`,
      `• Sessions: *${deps.sessionManager.count()}*`,
      `• Owner(s): ${(c.owner || []).join(', ') || '(none)'}`,
    ];
    await ctx.reply(lines.join('\n'));
  },
};

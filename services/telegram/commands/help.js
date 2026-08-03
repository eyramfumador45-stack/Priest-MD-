/**
 * services/telegram/commands/help.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /help — Lists all available control-panel commands.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');

const COMMANDS = [
  ['/start', 'Welcome message'],
  ['/pair', 'Pair a new WhatsApp number'],
  ['/status', 'Overall system status'],
  ['/sessions', 'List & manage active sessions'],
  ['/restart <num>', 'Restart a session'],
  ['/update', 'Check for framework updates'],
  ['/logs', 'View recent logs'],
  ['/plugins', 'List loaded plugins'],
  ['/settings', 'View current settings'],
  ['/backup', 'Create a backup'],
  ['/restore', 'Restore from a backup'],
  ['/shutdown', 'Gracefully shut down the bot'],
  ['/menu', 'Full menu'],
  ['/about', 'About Priest MD'],
  ['/cancel', 'Cancel current operation'],
];

module.exports = {
  name: 'help',
  description: 'List all commands',
  aliases: ['commands'],
  handler: async (ctx) => {
    const lines = ['📖 *Priest MD — Help*\n'];
    COMMANDS.forEach(([c, d]) => lines.push(`\`${c}\` — ${d}`));
    lines.push(`\n${config.branding.officialBranding}`);
    await ctx.reply(lines.join('\n'));
  },
};

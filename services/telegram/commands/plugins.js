/**
 * services/telegram/commands/plugins.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /plugins — List loaded WhatsApp plugins.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'plugins',
  description: 'List loaded plugins',
  handler: async (ctx, deps) => {
    const plugins = deps.pluginManager.plugins;
    if (!plugins.size) {
      await ctx.reply('🧩 No plugins loaded.');
      return;
    }
    const lines = ['🧩 *Loaded Plugins*\n'];
    for (const p of plugins.values()) {
      lines.push(`• *${p.name}* v${p.version} — ${p.description}`);
    }
    await ctx.reply(lines.join('\n'));
  },
};

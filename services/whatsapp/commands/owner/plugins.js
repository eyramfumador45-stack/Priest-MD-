/**
 * commands/owner/plugins.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .plugins — list loaded plugins; .plugins reload — hot-reload plugins.
 * -----------------------------------------------------------------------------
 */

'use strict';

const pluginManager = require('../../plugins');
const registry = require('../index');

module.exports = {
  name: 'plugins',
  description: 'Manage plugins',
  aliases: ['plugin'],
  category: 'owner',
  usage: '.plugins | .plugins reload',
  owner: true,
  cooldown: 10000,
  execute: async (ctx) => {
    if (ctx.argList[0] === 'reload') {
      // Re-run plugin loading and command discovery.
      pluginManager.loadAll();
      await registry.loadAll();
      return ctx.reply({ text: `🔄 Reloaded. *${pluginManager.plugins.size}* plugins active.` });
    }

    if (!pluginManager.plugins.size) {
      return ctx.reply({ text: '🧩 No plugins loaded.' });
    }
    const lines = ['🧩 *Plugins*\n'];
    for (const p of pluginManager.plugins.values()) {
      lines.push(`• *${p.name}* v${p.version} — ${p.description || 'no description'}`);
    }
    await ctx.reply({ text: lines.join('\n') });
  },
};

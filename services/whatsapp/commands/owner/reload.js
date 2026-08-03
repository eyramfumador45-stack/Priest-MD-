/**
 * commands/owner/reload.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .reload [command] — hot-reload all commands, or a single command by name.
 * -----------------------------------------------------------------------------
 */

'use strict';

const registry = require('../index');

module.exports = {
  name: 'reload',
  description: 'Hot-reload commands',
  aliases: ['rl'],
  category: 'owner',
  usage: '.reload [command]',
  owner: true,
  cooldown: 5000,
  execute: async (ctx) => {
    const target = ctx.argList[0];
    if (target) {
      const cmd = registry.reload(target);
      if (cmd) return ctx.reply({ text: `🔄 Reloaded command "${cmd.name}".` });
      return ctx.reply({ text: `❌ Command "${target}" not found.` });
    }
    const count = await registry.loadAll();
    await ctx.reply({ text: `🔄 Reloaded *${count}* commands.` });
  },
};

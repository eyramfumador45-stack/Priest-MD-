/**
 * commands/group/welcome.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .welcome [message] — customise or toggle the group welcome message.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'welcome',
  description: 'Customise or toggle the welcome message',
  aliases: [],
  category: 'group',
  usage: '.welcome [message] | .welcome on|off',
  cooldown: 5000,
  group: true,
  execute: async (ctx) => {
    if (!ctx.isGroup) return ctx.reply({ text: '👥 Groups only.' });
    const { Group } = ctx.db;
    const arg = ctx.argList.join(' ').trim();

    if (arg === 'on' || arg === 'off') {
      const val = arg === 'on';
      await Group.updateOne({ jid: ctx.jid }, { $set: { 'settings.welcome': val } }, { upsert: true });
      return ctx.reply({ text: `✅ Welcome system *${val ? 'ON' : 'OFF'}*.` });
    }

    if (!arg) {
      return ctx.reply({ text: 'Usage: `.welcome <message>` or `.welcome on|off`' });
    }

    await Group.updateOne(
      { jid: ctx.jid },
      { $set: { welcomeMessage: arg, 'settings.welcome': true } },
      { upsert: true }
    );
    await ctx.reply({ text: `✅ Welcome message updated.\n\n"${arg}"` });
  },
};

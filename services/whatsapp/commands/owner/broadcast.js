/**
 * commands/owner/broadcast.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .broadcast <message> — broadcast a message to all groups the bot is in.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'broadcast',
  description: 'Broadcast a message to all groups',
  aliases: ['bc', 'blast'],
  category: 'owner',
  usage: '.broadcast <message>',
  owner: true,
  cooldown: 20000,
  execute: async (ctx) => {
    const text = ctx.argList.join(' ').trim();
    if (!text) return ctx.reply({ text: 'Usage: `.broadcast <message>`' });

    await ctx.reply({ text: '📢 Broadcasting...' });

    const { Group } = ctx.db;
    const groups = await Group.find({}).lean();
    const delay = ctx.config.limits?.broadcastDelayMs || 2000;
    let sent = 0;

    for (const g of groups) {
      try {
        await ctx.sock.sendMessage(g.jid, { text });
        sent++;
        await new Promise((r) => setTimeout(r, delay));
      } catch (e) { /* skip failed */ }
    }
    await ctx.reply({ text: `✅ Broadcast sent to *${sent}* group(s).` });
  },
};

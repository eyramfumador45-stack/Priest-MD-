/**
 * commands/security/antilink.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .antilink [on|off] — toggle the anti-link protection for the group.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'antilink',
  description: 'Toggle anti-link protection',
  aliases: ['nolink'],
  category: 'security',
  usage: '.antilink [on|off]',
  cooldown: 5000,
  group: true,
  execute: async (ctx) => {
    if (!ctx.isGroup) return ctx.reply({ text: '👥 Groups only.' });
    const { Group } = ctx.db;
    const arg = ctx.argList[0] ? ctx.argList[0].toLowerCase() : null;
    const group = await Group.findOne({ jid: ctx.jid });
    let val;
    if (arg === 'on') val = true;
    else if (arg === 'off') val = false;
    else val = !(group?.settings?.antiLink || false);

    await Group.updateOne(
      { jid: ctx.jid },
      { $set: { 'settings.antiLink': val } },
      { upsert: true }
    );
    await ctx.reply({ text: `🛡️ Anti-link is now *${val ? 'ON' : 'OFF'}*.` });
  },
};

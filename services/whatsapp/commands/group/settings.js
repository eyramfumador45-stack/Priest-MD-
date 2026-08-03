/**
 * commands/group/settings.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .settings [key] [on|off] — view or toggle group settings (welcome, leveling,
 * anti-spam, anti-link, etc). Group admin command.
 * -----------------------------------------------------------------------------
 */

'use strict';

const TOGGLEABLE = [
  'welcome', 'goodbye', 'leveling', 'economy', 'nsfw',
  'antiLink', 'antiBot', 'antiSpam', 'antiRaid', 'antiNuke',
  'antiCall', 'antiDelete', 'antiMention', 'antiAbuse', 'antiInvite', 'mute',
];

module.exports = {
  name: 'settings',
  description: 'View or toggle group settings',
  aliases: ['setting', 'set'],
  category: 'group',
  usage: '.settings [key] [on|off]',
  cooldown: 5000,
  group: true,
  execute: async (ctx) => {
    if (!ctx.isGroup) return ctx.reply({ text: '👥 Groups only.' });
    const { Group } = ctx.db;

    let group = await Group.findOne({ jid: ctx.jid });
    if (!group) {
      group = await Group.create({ jid: ctx.jid, name: (await ctx.getGroupMetadata())?.subject || '' });
    }

    const key = ctx.argList[0] ? ctx.argList[0].toLowerCase() : null;

    // View all settings.
    if (!key) {
      const s = group.settings || {};
      const lines = ['⚙️ *Group Settings*\n'];
      for (const t of TOGGLEABLE) {
        lines.push(`• ${t}: ${s[t] ? '✅' : '❌'}`);
      }
      return ctx.reply({ text: lines.join('\n') });
    }

    // Normalise key.
    const normKey = TOGGLEABLE.find((t) => t.toLowerCase() === key);
    if (!normKey) {
      return ctx.reply({ text: `Unknown setting. Available: ${TOGGLEABLE.join(', ')}` });
    }

    const value = ctx.argList[1] ? ctx.argList[1].toLowerCase() : null;
    let newVal = value === 'on' || value === 'true' || value === '1';
    if (value !== 'on' && value !== 'off' && value !== 'true' && value !== 'false' && value !== '1' && value !== '0') {
      // Toggle current value.
      newVal = !(group.settings[normKey] || false);
    }

    await Group.updateOne(
      { jid: ctx.jid },
      { $set: { [`settings.${normKey}`]: newVal } }
    );
    await ctx.reply({ text: `✅ \`${normKey}\` set to *${newVal ? 'ON' : 'OFF'}*.` });
  },
};

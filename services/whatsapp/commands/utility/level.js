/**
 * commands/utility/level.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .level [@mention] — show a user's level & XP progress.
 * -----------------------------------------------------------------------------
 */

'use strict';

const helpers = require('../../../../shared/helpers');
const { levelForXp, xpForLevel } = require('../../../../shared/utils/leveling');

module.exports = {
  name: 'level',
  description: 'Check your (or another user\'s) level',
  aliases: ['rank'],
  category: 'utility',
  usage: '.level [@mention]',
  cooldown: 5000,
  execute: async (ctx) => {
    const mentioned = ctx.msg?.content?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = (mentioned && mentioned[0]) || ctx.sender;
    const { User } = ctx.db;
    const user = await User.findOne({ jid: target });
    if (!user) {
      return ctx.reply({ text: 'No level data yet. Send some messages to gain XP!' });
    }
    const xp = user.xp || 0;
    const level = user.level || 1;
    const current = xpForLevel(level);
    const next = xpForLevel(level + 1);
    const pct = Math.round(((xp - current) / (next - current)) * 100);
    const bar = ctx.utils.bar(pct, 10);
    await ctx.reply({
      text: `📊 *${user.name || helpers.phone.jidToNumber(target)}*\n\n` +
        `Level: *${level}*\nXP: *${xp}*\nProgress: ${bar}\n\n${ctx.config.branding.officialBranding}`,
    });
  },
};

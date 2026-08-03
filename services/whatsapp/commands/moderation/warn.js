/**
 * commands/moderation/warn.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .warn <@mention> [reason] — warn a member (3 warns auto-kick).
 * -----------------------------------------------------------------------------
 */

'use strict';

const helpers = require('../../../../shared/helpers');

const MAX_WARNS = 3;

module.exports = {
  name: 'warn',
  description: 'Warn a member (3 warns = kick)',
  aliases: [],
  category: 'moderation',
  usage: '.warn <@mention> [reason]',
  cooldown: 5000,
  group: true,
  execute: async (ctx) => {
    if (!ctx.isGroup) return ctx.reply({ text: '👥 Groups only.' });
    const mentioned = ctx.msg?.content?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = mentioned && mentioned[0];
    if (!target) return ctx.reply({ text: 'Mention a user to warn. Usage: `.warn <@mention>`' });

    const reason = ctx.argList.slice(1).join(' ') || 'No reason provided';
    const { Warning, Group } = ctx.db;
    const warn = await Warning.findOne({ groupJid: ctx.jid, userJid: target });
    const count = (warn ? warn.count : 0) + 1;

    await Warning.findOneAndUpdate(
      { groupJid: ctx.jid, userJid: target },
      { $set: { count, reason, warnedBy: ctx.sender }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );

    if (count >= MAX_WARNS) {
      await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], 'remove');
      await Group.updateOne({ jid: ctx.jid }, { $unset: { [`warnedMembers.${target}`]: '' } });
      await ctx.reply({ text: `🚫 *${helpers.phone.jidToNumber(target)}* has been *kicked* (${count} warnings).` });
    } else {
      await ctx.reply({
        text: `⚠️ *Warning ${count}/${MAX_WARNS}*\n\nUser: *${helpers.phone.jidToNumber(target)}*\nReason: ${reason}`,
      });
    }
  },
};

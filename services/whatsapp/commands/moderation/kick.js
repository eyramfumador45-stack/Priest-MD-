/**
 * commands/moderation/kick.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .kick <@mention|number> — remove a member from the group (group admin).
 * -----------------------------------------------------------------------------
 */

'use strict';

const helpers = require('../../../../shared/helpers');

module.exports = {
  name: 'kick',
  description: 'Remove a member from the group',
  aliases: ['remove'],
  category: 'moderation',
  usage: '.kick <@mention|number>',
  cooldown: 5000,
  group: true,
  execute: async (ctx) => {
    if (!ctx.isGroup) {
      return ctx.reply({ text: '👥 This command only works in groups.' });
    }
    // Resolve target from mention or raw number.
    const mentioned = ctx.msg?.content?.extendedTextMessage?.contextInfo?.mentionedJid;
    let target = mentioned && mentioned[0];
    if (!target) {
      const num = ctx.utils ? null : null;
      const raw = ctx.argList[0];
      target = helpers.phone.toJid(raw);
    }
    if (!target) {
      return ctx.reply({ text: 'Usage: `.kick <@mention|number>`' });
    }
    if (target === ctx.jid.replace('@g.us', '@s.whatsapp.net') || target === ctx.sock.user?.id) {
      return ctx.reply({ text: 'I cannot kick myself. 🙅' });
    }
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], 'remove');
      await ctx.reply({ text: `👋 *${helpers.phone.jidToNumber(target)}* was removed.` });
    } catch (err) {
      await ctx.reply({ text: `❌ Failed to kick: ${err.message}` });
    }
  },
};

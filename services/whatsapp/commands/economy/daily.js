/**
 * commands/economy/daily.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .daily — claim daily coins.
 * -----------------------------------------------------------------------------
 */

'use strict';

const helpers = require('../../../../shared/helpers');

const DAILY_REWARD = 100;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

module.exports = {
  name: 'daily',
  description: 'Claim your daily reward',
  aliases: [],
  category: 'economy',
  usage: '.daily',
  cooldown: 5000,
  execute: async (ctx) => {
    const { Economy, User } = ctx.db;
    const user = await User.findOneAndUpdate(
      { jid: ctx.sender },
      { $setOnInsert: { jid: ctx.sender, number: ctx.senderNumber, name: ctx.msg?.pushName || '' } },
      { upsert: true, new: true }
    );

    let econ = await Economy.findOne({ userJid: ctx.sender });
    const now = Date.now();
    if (econ && econ.lastDaily && now - econ.lastDaily.getTime() < COOLDOWN_MS) {
      const remaining = helpers.time.duration(COOLDOWN_MS - (now - econ.lastDaily.getTime()));
      return ctx.reply({ text: `⏳ Daily reward already claimed. Try again in *${remaining}*.` });
    }

    econ = await Economy.findOneAndUpdate(
      { userJid: ctx.sender },
      {
        $inc: { wallet: DAILY_REWARD, totalEarned: DAILY_REWARD, dailyStreak: 1 },
        $set: { lastDaily: new Date() },
      },
      { upsert: true, new: true }
    );

    await ctx.reply({ text: `🎁 *Daily reward claimed!*\n\n+${DAILY_REWARD} 🪙 coins\n\nWallet: *${econ.wallet}* coins` });
  },
};

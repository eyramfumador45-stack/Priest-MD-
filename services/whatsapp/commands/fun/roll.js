/**
 * commands/fun/roll.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .roll — roll a dice (or a custom-sided die).
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'roll',
  description: 'Roll a dice',
  aliases: ['dice'],
  category: 'fun',
  usage: '.roll [sides]',
  cooldown: 3000,
  execute: async (ctx) => {
    const sides = Math.max(2, parseInt(ctx.argList[0], 10) || 6);
    const result = Math.floor(Math.random() * sides) + 1;
    await ctx.reply({ text: `🎲 You rolled a *${result}* (d${sides}).` });
  },
};

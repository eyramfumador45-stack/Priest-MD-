/**
 * commands/fun/quote.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .quote — an inspirational quote.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'quote',
  description: 'Get an inspirational quote',
  aliases: ['inspire'],
  category: 'fun',
  usage: '.quote',
  cooldown: 5000,
  execute: async (ctx) => {
    const quotes = [
      ['The only way to do great work is to love what you do.', 'Steve Jobs'],
      ['It always seems impossible until it\'s done.', 'Nelson Mandela'],
      ['Believe you can and you\'re halfway there.', 'Theodore Roosevelt'],
      ['Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill'],
      ['The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt'],
    ];
    const [text, author] = ctx.utils.random(quotes);
    await ctx.reply({ text: `💬 *"${text}"*\n\n— *${author}*` });
  },
};

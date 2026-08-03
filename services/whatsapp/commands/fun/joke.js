/**
 * commands/fun/joke.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .joke — random joke from a built-in collection.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'joke',
  description: 'Get a random joke',
  aliases: ['dadjoke'],
  category: 'fun',
  usage: '.joke',
  cooldown: 5000,
  execute: async (ctx) => {
    const jokes = [
      'Why do programmers prefer dark mode? Because light attracts bugs. 🐛',
      'I told my computer I needed a break... now it won\'t stop sending me KitKat ads.',
      'Why did the developer go broke? Because he used up all his cache. 💸',
      'There are 10 types of people: those who understand binary and those who don\'t.',
      'Why was the JavaScript developer sad? Because he didn\'t know how to "null" his feelings.',
      'I would tell you a UDP joke, but you might not get it.',
    ];
    const joke = ctx.utils.random(jokes);
    await ctx.reply({ text: `😂 ${joke}` });
  },
};

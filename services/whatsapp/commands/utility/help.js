/**
 * commands/utility/help.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .help — list available commands grouped by category.
 * -----------------------------------------------------------------------------
 */

'use strict';

const registry = require('../index');
const config = require('../../../../config/config');

module.exports = {
  name: 'help',
  description: 'List all commands',
  aliases: ['h', 'menu'],
  category: 'utility',
  usage: '.help',
  cooldown: 5000,
  execute: async (ctx) => {
    const commands = registry.list().filter((c) => !c.owner && !c.admin);
    const byCat = {};
    for (const c of commands) {
      (byCat[c.category] = byCat[c.category] || []).push(c.name);
    }
    const lines = ['📖 *Command List*\n'];
    for (const [cat, names] of Object.entries(byCat)) {
      lines.push(`*${cat.charAt(0).toUpperCase() + cat.slice(1)}*\n  ${names.map((n) => `.${n}`).join(', ')}\n`);
    }
    lines.push(config.branding.officialBranding);
    const text = lines.join('\n');
    const chunks = ctx.utils.chunk(text, 4096);
    for (const chunk of chunks) await ctx.reply({ text: chunk });
  },
};

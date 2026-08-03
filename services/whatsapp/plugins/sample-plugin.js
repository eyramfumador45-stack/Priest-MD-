/**
 * services/whatsapp/plugins/sample-plugin.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Sample WhatsApp plugin demonstrating the plugin API. Copy this file to add
 * new commands WITHOUT editing core source code.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'sample-plugin',
  version: '1.0.0',
  description: 'Demonstrates the plugin API.',
  author: 'Inkora Systems',

  install(api) {
    api.registerCommand({
      name: 'pluginhit',
      description: 'A command added by the sample plugin',
      aliases: ['phit'],
      category: 'fun',
      usage: '.pluginhit',
      execute: async (ctx) => {
        await ctx.reply({ text: '🧩 Hello from the *sample plugin*! Plugin system is working.' });
      },
    });
  },
};

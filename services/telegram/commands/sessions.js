/**
 * services/telegram/commands/sessions.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /sessions — Display the session dashboard with inline controls.
 * -----------------------------------------------------------------------------
 */

'use strict';

const dashboard = require('../dashboard');

module.exports = {
  name: 'sessions',
  description: 'List & manage active sessions',
  aliases: ['dashboard', 'list'],
  handler: async (ctx) => {
    await dashboard.sendDashboard(ctx, false);
  },
};

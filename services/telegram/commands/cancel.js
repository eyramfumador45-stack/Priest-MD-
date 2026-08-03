/**
 * services/telegram/commands/cancel.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /cancel — Abort the current pairing / operation.
 * -----------------------------------------------------------------------------
 */

'use strict';

const pairing = require('../pairing');

module.exports = {
  name: 'cancel',
  description: 'Cancel current operation',
  aliases: ['abort', 'stop'],
  handler: async (ctx) => {
    await pairing.cancel(ctx);
  },
};

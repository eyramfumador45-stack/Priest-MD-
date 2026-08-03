/**
 * services/telegram/commands/update.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /update — Check the running version against the registry / git.
 * -----------------------------------------------------------------------------
 */

'use strict';

const pkg = require('../../../package.json');

module.exports = {
  name: 'update',
  description: 'Check for framework updates',
  handler: async (ctx) => {
    await ctx.reply(
      `🔄 *Update Check*\n\n` +
        `Current version: *v${pkg.version}*\n\n` +
        `Automatic update fetching is handled by the scheduler / CI pipeline. ` +
        `Run \`git pull\` and \`npm install\` on the server to update, then restart.`
    );
  },
};

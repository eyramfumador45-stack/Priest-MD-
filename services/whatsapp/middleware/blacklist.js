/**
 * services/whatsapp/middleware/blacklist.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Blocks blacklisted users and groups from interacting with the bot.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = function blacklistMiddleware() {
  return async function blacklist(ctx, next) {
    const blockedUser = ctx.config.isBlacklistedUser(ctx.senderNumber) ||
      ctx.config.isBlacklistedUser(ctx.sender);
    const blockedGroup = ctx.isGroup && ctx.config.isBlacklistedGroup(ctx.jid);

    if (blockedUser || blockedGroup) {
      ctx._handled = true;
      ctx.logger.warn('blocked interaction', { sender: ctx.sender, group: ctx.jid });
      return;
    }
    return next();
  };
};

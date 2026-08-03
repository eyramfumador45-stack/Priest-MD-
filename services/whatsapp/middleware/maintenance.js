/**
 * services/whatsapp/middleware/maintenance.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Maintenance-mode gate. Only owners may interact while maintenance is on.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = function maintenanceMiddleware() {
  return async function maintenance(ctx, next) {
    const maintenanceOn = ctx.config?.bot?.maintenance === true;
    if (!maintenanceOn) return next();

    const isOwner = ctx.config.isOwner(ctx.senderNumber) ||
      ctx.config.isOwner(ctx.sender);
    if (!isOwner) {
      ctx._handled = true;
      await ctx.reply({ text: '🔧 *Priest MD* is under maintenance. Please try again later.' });
      return;
    }
    return next();
  };
};

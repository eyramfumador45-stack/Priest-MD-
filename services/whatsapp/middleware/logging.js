/**
 * services/whatsapp/middleware/logging.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Logs every command usage (console + persisted Log record when DB is up).
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = function loggingMiddleware() {
  return async function logging(ctx, next) {
    if (ctx.isCommand && ctx.command) {
      ctx.logger.info(`command "${ctx.commandName}" by ${ctx.senderNumber}`, {
        args: ctx.args,
        group: ctx.isGroup ? ctx.jid : null,
      });
      try {
        const { Log } = ctx.db;
        await Log.create({
          level: 'info',
          category: 'command',
          message: `${ctx.commandName} executed`,
          userJid: ctx.sender,
          groupJid: ctx.isGroup ? ctx.jid : null,
          command: ctx.commandName,
          meta: { args: ctx.args },
        });
      } catch (e) { /* non-fatal */ }
    }
    return next();
  };
};

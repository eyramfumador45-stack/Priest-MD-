/**
 * services/whatsapp/events/messages.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Handles messages.upsert — the primary entry point for commands, leveling,
 * auto-responses and security scanners.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');
const { handleMessage } = require('../message-handler');

module.exports = function messagesHandler(sock, session) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      // Fire-and-forget so one slow message never blocks the queue.
      handleMessage(sock, msg, session).catch((err) => {
        logger.error('[events:messages] handler error', { error: err.message });
      });

      // Optional leveling: award XP best-effort (non-blocking).
      if (session.levelingEnabled && msg.key && !msg.key.fromMe) {
        const { buildContext } = require('../ctx-builder');
        buildContext(sock, msg, session)
          .then((ctx) => {
            const { awardXp } = require('../../../shared/utils/leveling');
            awardXp(ctx).catch(() => {});
          })
          .catch(() => {});
      }
    }
  });
};

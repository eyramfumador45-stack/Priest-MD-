/**
 * services/whatsapp/events/reaction.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Handles messages.update with reaction updates (emoji reactions on messages).
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');

module.exports = function reactionHandler(sock, session) {
  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      if (update?.update?.reactions) {
        try {
          session.emit('reaction', { key: update.key, reactions: update.update.reactions });
        } catch (err) {
          logger.warn('[events:reaction] error', { error: err.message });
        }
      }
    }
  });
};

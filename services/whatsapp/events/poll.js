/**
 * services/whatsapp/events/poll.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Handles poll votes (poll.update / messages with pollCreationMessage) — used
 * by games & interactive features.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');

module.exports = function pollHandler(sock, session) {
  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      const pollUpdate = update?.update?.pollUpdates;
      if (!pollUpdate) continue;
      try {
        logger.debug(`[session:${session.number}] poll update received`);
        // Forward to any registered poll listeners.
        session.emit('poll', { key: update.key, pollUpdates: pollUpdate });
      } catch (err) {
        logger.warn('[events:poll] error', { error: err.message });
      }
    }
  });
};

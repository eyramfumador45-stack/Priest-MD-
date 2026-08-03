/**
 * services/whatsapp/events/group-update.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Handles group.update — subject changes, description changes, icon, etc.
 * Syncs group metadata to the Groups collection.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');

module.exports = function groupUpdateHandler(sock, session) {
  sock.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      try {
        const { id, subject, desc } = update;
        const { Group } = require('../../../database/models');
        await Group.updateOne(
          { jid: id },
          {
            $set: {
              ...(subject ? { name: subject } : {}),
              ...(desc ? { description: desc } : {}),
            },
          },
          { upsert: true }
        );
      } catch (err) {
        logger.warn('[events:group-update] error', { error: err.message });
      }
    }
  });
};

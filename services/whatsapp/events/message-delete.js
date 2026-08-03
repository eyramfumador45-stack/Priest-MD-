/**
 * services/whatsapp/events/message-delete.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Handles message deletions (messages.update with 'deleted' status). When
 * anti-delete is enabled, re-posts the deleted content to the group.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');
const config = require('../../../config/config');

/**
 * In-memory message cache (jid:id → message). Baileys 6.x no longer exposes
 * `sock.loadMessage`, so we keep our own bounded store populated from
 * messages.upsert and look deletions up here.
 */
const MAX_CACHE = 5000;
const messageCache = new Map();

function cacheKey(key) {
  return `${key?.remoteJid || ''}:${key?.id || ''}`;
}

module.exports = function messageDeleteHandler(sock, session) {
  // Populate the cache from the upsert stream (also used by the delete hook).
  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const ms of messages || []) {
      if (!ms?.key?.id) continue;
      messageCache.set(cacheKey(ms.key), ms);
    }
    while (messageCache.size > MAX_CACHE) {
      const oldest = messageCache.keys().next().value;
      if (oldest === undefined) break;
      messageCache.delete(oldest);
    }
  });

  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      const status = update?.update?.status;
      const isDelete = status === 7; // ProtocolMessage/delete
      if (!isDelete) continue;

      const antiDelete = config.security?.antiDelete?.enabled;
      if (!antiDelete) return;

      try {
        const key = update.key;
        const cached = messageCache.get(cacheKey(key));
        const original = cached?.message
          ? cached
          : (await sock.getMessage?.(key).catch(() => null)) || null;

        if (original?.message) {
          const content =
            original.message.conversation ||
            original.message.extendedTextMessage?.text ||
            '(media message)';
          await sock.sendMessage(key.remoteJid, {
            text: `🛡️ *Deleted message detected* from ${key.participant || key.remoteJid}:\n> ${content}`,
          });
        }
      } catch (err) {
        logger.warn('[events:message-delete] error', { error: err.message });
      }
    }
  });
};

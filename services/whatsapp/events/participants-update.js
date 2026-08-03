/**
 * services/whatsapp/events/participants-update.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Handles group-participants.update — welcome/goodbye system and triggers the
 * anti-raid / anti-hijack security scanners.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');

module.exports = function participantsUpdateHandler(sock, session) {
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    try {
      const models = require('../../../database/models');
      const group = await models.Group.findOne({ jid: id });

      if (action === 'add' && group?.settings?.welcome !== false) {
        const names = [];
        for (const p of participants) {
          try {
            // Best-effort contact name resolution. `sock.getContact` does not
            // exist on @whiskeysockets/baileys 6.x — use the in-memory contacts
            // map when available, otherwise fall back to the number.
            const contact =
              (sock.contacts && (sock.contacts.get?.(p) || sock.contacts[p])) || null;
            const notify = contact?.notify || contact?.name || contact?.verifiedName;
            names.push(notify || p.split('@')[0]);
          } catch (e) {
            names.push(p.split('@')[0]);
          }
        }
        const greeting = group.welcomeMessage ||
          `👋 Welcome, *${names.join(', ')}*!\n\nEnjoy your stay in *${group.name || 'this group'}*.`;
        await sock.sendMessage(id, { text: greeting });
      }

      if (action === 'remove' && group?.settings?.goodbye !== false) {
        const text = group.goodbyeMessage ||
          `👋 ${participants.map((p) => p.split('@')[0]).join(', ')} has left the group.`;
        await sock.sendMessage(id, { text });
      }

      // Trigger anti-raid / anti-hijack scanners asynchronously.
      session.emit('participants-change', { id, participants, action });
    } catch (err) {
      logger.warn('[events:participants-update] error', { error: err.message });
    }
  });
};

/**
 * scheduler/reminders.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Reminder job — dispatches due scheduled messages through the owning WhatsApp
 * session. Supports one-shot and recurring reminders.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../shared/logger');
const { safe } = require('../shared/utils/safe');
const database = require('../database');
const sessionManager = require('../services/whatsapp/session-manager');

async function run() {
  if (!database.isConnected()) return 0; // reminders need the DB
  const { Reminder } = require('../database/models');

  const due = await safe(
    () => Reminder.find({ sent: false, sendAt: { $lte: new Date() } }).limit(100),
    [],
    'reminders-fetch'
  );
  if (!due.length) return 0;

  let sent = 0;
  for (const reminder of due) {
    const svc = sessionManager.get(reminder.sessionNumber);
    if (!svc || svc.status !== 'online') continue;

    try {
      await svc.sendMessage(reminder.chatJid, { text: reminder.message });
      if (reminder.recurring) {
        // Recurring: recompute next send (daily by default).
        const next = new Date(reminder.sendAt.getTime() + 24 * 3600 * 1000);
        reminder.sendAt = next;
        reminder.lastSentAt = new Date();
        await reminder.save();
      } else {
        reminder.sent = true;
        reminder.lastSentAt = new Date();
        await reminder.save();
      }
      sent++;
    } catch (err) {
      logger.warn('[scheduler:reminders] send failed', { id: reminder._id, error: err.message });
    }
  }
  return sent;
}

module.exports = { run };

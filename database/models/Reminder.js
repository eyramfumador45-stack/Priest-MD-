/**
 * database/models/Reminder.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Scheduled reminder jobs.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const ReminderSchema = new Schema(
  {
    sessionNumber: { type: String, index: true },
    chatJid: { type: String, index: true },
    userJid: { type: String, index: true },
    message: { type: String, required: true },
    sendAt: { type: Date, required: true, index: true },
    recurring: { type: String, default: '' }, // cron expression or '' for one-shot
    sent: { type: Boolean, default: false },
    lastSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ReminderSchema.index({ sendAt: 1, sent: 1 });

module.exports = model('Reminder', ReminderSchema);

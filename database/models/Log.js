/**
 * database/models/Log.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * General application log records (command usage, telegram actions, etc.).
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const LogSchema = new Schema(
  {
    level: { type: String, default: 'info', index: true },
    category: { type: String, index: true },   // command | telegram | pairing | session | security | system
    message: { type: String, default: '' },
    userJid: { type: String, index: true },
    groupJid: { type: String, index: true },
    command: { type: String },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

LogSchema.index({ createdAt: -1 });

module.exports = model('Log', LogSchema);

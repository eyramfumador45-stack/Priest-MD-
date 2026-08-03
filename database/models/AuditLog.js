/**
 * database/models/AuditLog.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Security & audit trail. Persisted by the shared logger and security modules.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const AuditLogSchema = new Schema(
  {
    level: { type: String, default: 'info', index: true },
    category: { type: String, default: 'general', index: true }, // security | pairing | admin | system
    action: { type: String, default: '', index: true },
    message: { type: String, default: '' },
    actor: { type: String, default: '' },       // who did it
    target: { type: String, default: '' },      // who/what it was done to
    groupJid: { type: String, index: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

module.exports = model('AuditLog', AuditLogSchema);

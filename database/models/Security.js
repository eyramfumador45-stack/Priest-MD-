/**
 * database/models/Security.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Per-session & per-group security runtime state (captcha, verification,
 * flood counters snapshots, hijack tracking, etc.).
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const SecuritySchema = new Schema(
  {
    key: { type: String, required: true, index: true, unique: true }, // `${scope}:${jid}`
    scope: { type: String, default: 'group' },                        // group | session | user
    jid: { type: String, index: true },
    data: { type: Object, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model('Security', SecuritySchema);

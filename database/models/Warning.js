/**
 * database/models/Warning.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Warning records (moderation). Aggregated per user per group.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const WarningSchema = new Schema(
  {
    groupJid: { type: String, index: true },
    userJid: { type: String, index: true },
    reason: { type: String, default: '' },
    warnedBy: { type: String, default: '' },
    count: { type: Number, default: 1 },
    expireAt: { type: Date, default: null },
  },
  { timestamps: true }
);

WarningSchema.index({ groupJid: 1, userJid: 1 });

module.exports = model('Warning', WarningSchema);

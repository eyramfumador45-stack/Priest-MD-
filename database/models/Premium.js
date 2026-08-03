/**
 * database/models/Premium.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Premium entitlements & subscriptions.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const PremiumSchema = new Schema(
  {
    userJid: { type: String, required: true, index: true, unique: true },
    plan: { type: String, default: 'basic' },   // basic | pro | ultimate
    active: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    grantedBy: { type: String, default: '' },
    features: { type: [String], default: [] },  // enabled premium feature keys
  },
  { timestamps: true }
);

PremiumSchema.index({ active: 1, expiresAt: 1 });

module.exports = model('Premium', PremiumSchema);

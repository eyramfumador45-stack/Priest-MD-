/**
 * database/models/Cooldown.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Persisted cooldown entries (shared across restarts).
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const CooldownSchema = new Schema(
  {
    key: { type: String, required: true, index: true, unique: true }, // `${userJid}:${command}`
    userJid: { type: String, index: true },
    command: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-expire old cooldowns (TTL index).
CooldownSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model('Cooldown', CooldownSchema);

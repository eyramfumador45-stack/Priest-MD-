/**
 * database/models/Economy.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Economy wallet & transactions for the games/economy system.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const EconomySchema = new Schema(
  {
    userJid: { type: String, required: true, index: true, unique: true },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    dailyStreak: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
    inventory: { type: Map, of: Number, default: {} },
    job: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = model('Economy', EconomySchema);

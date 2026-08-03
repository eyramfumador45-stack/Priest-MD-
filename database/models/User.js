/**
 * database/models/User.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * User document — WhatsApp + Telegram identity, level, premium, permissions.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const UserSchema = new Schema(
  {
    jid: { type: String, required: true, index: true },           // 233XXXX@s.whatsapp.net
    number: { type: String, index: true },                        // bare number
    name: { type: String, default: '' },
    telegramId: { type: String, index: true, default: '' },
    telegramUsername: { type: String, default: '' },
    role: { type: String, default: 'user', enum: ['user', 'mod', 'admin', 'owner', 'premium'] },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date, default: null },
    lastSeen: { type: Date, default: Date.now },
    locale: { type: String, default: 'en' },
  },
  { timestamps: true }
);

module.exports = model('User', UserSchema);

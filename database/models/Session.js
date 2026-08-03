/**
 * database/models/Session.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * WhatsApp multi-session registry. Credentials are stored on disk under
 * sessions/<number>/ — the DB holds the lightweight metadata + status.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const SessionSchema = new Schema(
  {
    number: { type: String, required: true, index: true, unique: true }, // bare number
    jid: { type: String, index: true },
    ownerTelegramId: { type: String, index: true },
    name: { type: String, default: '' },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'pairing', 'connecting', 'online', 'offline', 'error', 'banned'],
    },
    platform: { type: String, default: 'whatsapp' },
    pairedAt: { type: Date, default: null },
    lastActive: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    device: { type: Object, default: {} },       // baileys device info
    meta: { type: Object, default: {} },          // free-form
    banned: { type: Boolean, default: false },
    isRegistered: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    refs: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = model('Session', SessionSchema);

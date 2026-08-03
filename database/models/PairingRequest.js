/**
 * database/models/PairingRequest.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Telegram -> WhatsApp pairing requests and their lifecycle.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const PairingRequestSchema = new Schema(
  {
    requestId: { type: String, required: true, index: true, unique: true },
    telegramId: { type: String, index: true },
    number: { type: String, index: true },         // bare number being paired
    pairingCode: { type: String },                 // official 8-char code
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'code_generated', 'paired', 'failed', 'expired', 'cancelled'],
    },
    qr: { type: String, default: '' },             // optional QR data URL
    createdAt: { type: Date, default: Date.now, expires: 900 }, // auto-expire 15 min
    pairedAt: { type: Date, default: null },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = model('PairingRequest', PairingRequestSchema);

/**
 * database/models/Group.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * WhatsApp group settings & state.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const GroupSchema = new Schema(
  {
    jid: { type: String, required: true, index: true },           // XXXX@g.us
    name: { type: String, default: '' },
    subject: { type: String, default: '' },
    description: { type: String, default: '' },
    ownerJid: { type: String, default: '' },
    admins: { type: [String], default: [] },
    memberCount: { type: Number, default: 0 },
    settings: {
      antiLink: { type: Boolean, default: false },
      antiBot: { type: Boolean, default: false },
      antiRaid: { type: Boolean, default: false },
      antiNuke: { type: Boolean, default: false },
      antiSpam: { type: Boolean, default: false },
      antiCall: { type: Boolean, default: false },
      antiDelete: { type: Boolean, default: false },
      antiMention: { type: Boolean, default: false },
      antiAbuse: { type: Boolean, default: false },
      antiInvite: { type: Boolean, default: false },
      antiForeign: { type: Boolean, default: false },
      antiFake: { type: Boolean, default: false },
      welcome: { type: Boolean, default: true },
      goodbye: { type: Boolean, default: true },
      leveling: { type: Boolean, default: true },
      economy: { type: Boolean, default: true },
      nsfw: { type: Boolean, default: false },
      mute: { type: Boolean, default: false },
      locked: { type: Boolean, default: false },
    },
    welcomeMessage: { type: String, default: '' },
    goodbyeMessage: { type: String, default: '' },
    warnedMembers: { type: Map, of: Number, default: {} },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('Group', GroupSchema);

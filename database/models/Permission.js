/**
 * database/models/Permission.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Runtime permission grants (overrides on top of static role config).
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const PermissionSchema = new Schema(
  {
    userJid: { type: String, index: true },
    groupJid: { type: String, index: true },
    role: { type: String, default: 'user' },
    grants: { type: [String], default: [] },      // command names or permission keys
    revokes: { type: [String], default: [] },
  },
  { timestamps: true }
);

PermissionSchema.index({ userJid: 1, groupJid: 1 });

module.exports = model('Permission', PermissionSchema);

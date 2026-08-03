/**
 * database/models/Configuration.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Runtime-editable key/value configuration (overrides static config).
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const ConfigurationSchema = new Schema(
  {
    key: { type: String, required: true, index: true, unique: true },
    value: { type: Schema.Types.Mixed, default: null },
    description: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = model('Configuration', ConfigurationSchema);

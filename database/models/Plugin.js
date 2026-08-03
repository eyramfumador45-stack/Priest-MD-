/**
 * database/models/Plugin.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Plugin registry — loaded plugins, their enabled/disabled status.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const PluginSchema = new Schema(
  {
    name: { type: String, required: true, index: true, unique: true },
    description: { type: String, default: '' },
    version: { type: String, default: '1.0.0' },
    author: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    source: { type: String, default: 'local' },   // local | git | npm
    entry: { type: String, default: 'index.js' },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = model('Plugin', PluginSchema);

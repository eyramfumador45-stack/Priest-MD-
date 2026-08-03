/**
 * database/models/Statistic.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Usage/performance statistics (commands run, messages, session uptime).
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Schema, model } = require('mongoose');

const StatisticSchema = new Schema(
  {
    key: { type: String, required: true, index: true, unique: true },
    type: { type: String, default: 'counter' }, // counter | gauge | timer
    value: { type: Number, default: 0 },
    meta: { type: Object, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model('Statistic', StatisticSchema);

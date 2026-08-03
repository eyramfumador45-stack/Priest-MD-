/**
 * database/models/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Barrel export of all Mongoose models.
 * -----------------------------------------------------------------------------
 */

'use strict';

const mongoose = require('mongoose');

// Fail fast when MongoDB is down instead of buffering queries (avoids hangs).
// Applied here so any code loading models gets this behaviour, even when the
// database/index.js connection module isn't loaded first.
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

module.exports = {
  User: require('./User'),
  Group: require('./Group'),
  Session: require('./Session'),
  Warning: require('./Warning'),
  Economy: require('./Economy'),
  Security: require('./Security'),
  Permission: require('./Permission'),
  Statistic: require('./Statistic'),
  Cooldown: require('./Cooldown'),
  Log: require('./Log'),
  Configuration: require('./Configuration'),
  Premium: require('./Premium'),
  Plugin: require('./Plugin'),
  AuditLog: require('./AuditLog'),
  PairingRequest: require('./PairingRequest'),
};

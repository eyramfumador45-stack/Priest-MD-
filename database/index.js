/**
 * database/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * MongoDB connection manager (Mongoose). Loads all registered models.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const config = require('../config/config');
const logger = require('../shared/logger');
const { safe } = require('../shared/utils/safe');

// Fail fast when the DB is down instead of buffering queries indefinitely.
// Prevents any command/logger from hanging when MongoDB is unavailable.
// Set at module load so it applies even before connect() is called.
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

const models = new Map();

/** Register every model found in database/models/*.js */
function loadModels() {
  const dir = path.join(__dirname, 'models');
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js')) {
    try {
      // eslint-disable-next-line global-require
      const mod = require(path.join(dir, file));
      const name = mod.modelName;
      if (name) {
        models.set(name, mod);
        if (!models.has(`${name}s`)) models.set(`${name}s`, mod);
      }
    } catch (err) {
      logger.warn(`[database] failed to load model ${file}`, { error: err.message });
    }
  }
}

let connected = false;

/**
 * Connect to MongoDB. If unavailable, the framework continues in
 * memory/degraded mode rather than crashing.
 */
async function connect(uri = config.database.uri) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      ...(config.database.options || {}),
    });
    connected = true;
    loadModels();
    logger.info('[database] MongoDB connected', { uri: redact(uri) });
    return mongoose.connection;
  } catch (err) {
    connected = false;
    logger.warn('[database] MongoDB unavailable — running in degraded mode', { error: err.message });
    // Still register models so in-memory fallbacks work.
    loadModels();
    return null;
  }
}

function redact(uri = '') {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    return u.toString();
  } catch (e) {
    return String(uri).replace(/\/\/[^@/]+@/, '//***@');
  }
}

function isConnected() {
  return connected && mongoose.connection.readyState === 1;
}

function get(name) {
  if (models.has(name)) return models.get(name);
  if (mongoose.models[name]) return mongoose.models[name];
  return null;
}

async function disconnect() {
  try {
    await mongoose.disconnect();
    logger.info('[database] MongoDB disconnected');
  } catch (err) {
    logger.warn('[database] disconnect error', { error: err.message });
  }
}

module.exports = {
  connect,
  isConnected,
  get,
  disconnect,
  models,
  mongoose,
  safe,
};

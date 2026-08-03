/**
 * config/config.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Central configuration loader. Merges configuration.json + environment
 * variables. Nothing is hardcoded in the source of the framework.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env (optional) into process.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const branding = require('./branding');
const constants = require('./constants');

const CONFIG_PATH = path.join(__dirname, 'configuration.json');

/** Deep-merge utility (objects only). */
function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return source === undefined ? target : source;
  }
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = out[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      out[key] = deepMerge(tv, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
}

/** Load configuration.json; falls back to defaults if missing/corrupt. */
function loadFileConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[config] Failed to parse configuration.json: ${err.message}`);
  }
  return {};
}

/** Environment overrides (from .env / process env). */
function envOverrides() {
  const env = process.env;
  const result = {};
  if (env.BOT_NAME) result.bot = { name: env.BOT_NAME };
  if (env.OWNER_NAME) result.bot = { ...(result.bot || {}), ownerName: env.OWNER_NAME };
  if (env.BOT_PREFIX) result.bot = { ...(result.bot || {}), prefixes: env.BOT_PREFIX.split(',') };
  if (env.TELEGRAM_TOKEN) result.telegram = { token: env.TELEGRAM_TOKEN };
  if (env.TELEGRAM_ADMINS) {
    result.telegram = {
      ...(result.telegram || {}),
      admins: env.TELEGRAM_ADMINS.split(',').map((s) => s.trim()).filter(Boolean),
    };
  }
  if (env.MONGODB_URI) result.database = { uri: env.MONGODB_URI };
  if (env.OWNERS) result.owner = env.OWNERS.split(',').map((s) => s.trim()).filter(Boolean);
  if (env.LOG_LEVEL) result.logging = { level: env.LOG_LEVEL };
  if (env.API_KEYS) {
    try {
      result.apiKeys = JSON.parse(env.API_KEYS);
    } catch (e) { /* ignore invalid json */ }
  }
  // WhatsApp session bootstrap: optional SESSION_ID import (see session-manager).
  if (env.SESSION_ID) result.whatsapp = { ...(result.whatsapp || {}), sessionId: env.SESSION_ID };
  // WhatsApp runtime flags (optional, defaults come from configuration.json).
  if (env.WHATSAPP_AUTO_RECONNECT !== undefined) {
    result.whatsapp = {
      ...(result.whatsapp || {}),
      autoReconnect: env.WHATSAPP_AUTO_RECONNECT !== 'false',
    };
  }
  if (env.WHATSAPP_PAIRING_CODE !== undefined) {
    result.whatsapp = {
      ...(result.whatsapp || {}),
      usePairingCode: env.WHATSAPP_PAIRING_CODE !== 'false',
    };
  }
  if (env.WHATSAPP_RECONNECT_DELAY_MS) {
    result.whatsapp = {
      ...(result.whatsapp || {}),
      reconnectDelayMs: Number(env.WHATSAPP_RECONNECT_DELAY_MS) || 5000,
    };
  }
  if (env.WHATSAPP_MAX_RECONNECT_RETRIES) {
    result.whatsapp = {
      ...(result.whatsapp || {}),
      maxReconnectRetries: Number(env.WHATSAPP_MAX_RECONNECT_RETRIES) || 10,
    };
  }
  // Bot icon + connect music (optional overrides; defaults in configuration.json).
  if (env.WHATSAPP_BOT_ICON) {
    result.whatsapp = {
      ...(result.whatsapp || {}),
      botIcon: { ...(result.whatsapp?.botIcon || {}), file: env.WHATSAPP_BOT_ICON },
    };
  }
  if (env.WHATSAPP_CONNECT_MUSIC) {
    result.whatsapp = {
      ...(result.whatsapp || {}),
      connectMusic: { ...(result.whatsapp?.connectMusic || {}), file: env.WHATSAPP_CONNECT_MUSIC },
    };
  }
  if (env.WHATSAPP_CONNECT_MUSIC_TARGET) {
    result.whatsapp = {
      ...(result.whatsapp || {}),
      connectMusic: {
        ...(result.whatsapp?.connectMusic || {}),
        target: env.WHATSAPP_CONNECT_MUSIC_TARGET,
      },
    };
  }
  return result;
}

const fileConfig = loadFileConfig();
const envConfig = envOverrides();

const config = deepMerge(
  {
    // Minimal defaults so the framework boots even without configuration.json
    bot: { name: branding.name, developer: branding.developer, version: branding.version, prefixes: ['.'], groupPrefix: '.' },
    telegram: { enabled: true, allowPairing: true, admins: [], maxSessionsPerUser: 10, token: '' },
    whatsapp: {
    enabled: true,
    autoReconnect: true,
    reconnectDelayMs: 5000,
    usePairingCode: true,
    allowQr: true,
    botIcon: { enabled: true, file: 'assets/bot-icon.png' },
    connectMusic: { enabled: true, file: 'assets/music/connect.mp3', target: 'self' },
  },
    features: { blackhatCommands: true },
    security: {},
    logging: { level: 'info', console: true, file: true, auditEnabled: true },
    database: { uri: 'mongodb://127.0.0.1:27017/priestmd', options: {} },
    performance: { cacheEnabled: true, cacheTtlMs: 60000 },
    owner: [],
    admins: [],
    premium: [],
    blacklist: { users: [], groups: [], commands: [] },
  },
  fileConfig
);
const merged = deepMerge(config, envConfig);

module.exports = Object.freeze({
  ...merged,
  constants,
  branding,
  isOwner(id) {
    const ownerIds = [...(merged.owner || [])];
    return ownerIds.some((o) => o && String(o) === String(id));
  },
  isAdmin(id) {
    const ids = [...(merged.admins || []), ...(merged.owner || [])];
    return ids.some((o) => o && String(o) === String(id));
  },
  isPremium(id) {
    const ids = [...(merged.premium || [])];
    return ids.some((o) => o && String(o) === String(id));
  },
  isBlacklistedUser(id) {
    return (merged.blacklist.users || []).some((o) => o && String(o) === String(id));
  },
  isBlacklistedGroup(id) {
    return (merged.blacklist.groups || []).some((o) => o && String(o) === String(id));
  },
});

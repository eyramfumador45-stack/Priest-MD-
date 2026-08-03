/**
 * services/whatsapp/socket.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Baileys Multi-Device socket factory with disk-backed authentication state.
 *
 * Socket options are hardened (timeouts, retry policy, history-sync off) —
 * values ported from the black-hat-md WhatsApp service architecture and
 * adapted to Baileys 6.7.x. Connection *lifecycle* handling (reconnect,
 * backoff, session wipe) lives in connection.js; this module only builds the
 * socket, persists credentials and forwards QR codes.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const config = require('../../config/config');

const _userDevicesCache = new NodeCache({ stdTTL: 1800, useClones: false });

/**
 * Build a fresh Baileys socket for a given session number.
 * @param {object} opts
 * @param {string} opts.number bare number (no + / spaces)
 * @param {object} opts.logger pino-compatible logger (see shared/logger)
 * @param {function} opts.onQr(qr) called with each QR string
 */
async function createSocket({ number, logger, onQr }) {
  const sessionDir = path.join(__dirname, '..', '..', 'sessions', number);
  fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  // Baileys talks to its own pino logger internally; PRIEST MD's logger is
  // pino-compatible (trace/child/level) and remains the single app logger.
  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['Priest MD', 'Chrome', '1.0.0'],
    // --- hardened connection options (ported from black-hat-md) ---
    cachedGroupMetadata: undefined,
    userDevicesCache: _userDevicesCache,
    connectTimeoutMs: 15000,
    defaultQueryTimeoutMs: 20000,
    keepAliveIntervalMs: 20000,
    retryRequestDelayMs: 50,
    maxMsgRetryCount: 2,
    fireInitQueries: false,
    markOnlineOnConnect: config.whatsapp.markOnline !== false,
    syncFullHistory: config.whatsapp.syncFullHistory === true,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
    emitOwnEvents: true,
    getMessage: async () => {
      // Quoted-message lookups are resolved best-effort by the message store;
      // a safe undefined return lets Baileys continue without crashing.
      return undefined;
    },
  });

  // Persist credentials on every creds.update (first pairing, re-registrations).
  sock.ev.on('creds.update', saveCreds);

  // QR codes arrive inside connection.update — forward them only.
  sock.ev.on('connection.update', (update) => {
    if (update.qr && typeof onQr === 'function') {
      onQr(update.qr);
    }
  });

  return sock;
}

module.exports = { createSocket, DisconnectReason };

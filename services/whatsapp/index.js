/**
 * services/whatsapp/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * WhatsAppService: a single WhatsApp Multi-Device session. Handles socket
 * lifecycle, pairing, reconnects, message pipeline, security and persistence.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { EventEmitter } = require('events');
const path = require('path');

const config = require('../../config/config');
const logger = require('../../shared/logger');
const helpers = require('../../shared/helpers');
const { safe } = require('../../shared/utils/safe');
const { createSocket } = require('./socket');
const { setupConnectionHandler } = require('./connection');
const { attachHandlers } = require('./events');
const { SecurityManager } = require('./security');
const registry = require('./commands');

const BASE_SESSION_DIR = path.join(__dirname, '..', '..', 'sessions');

class WhatsAppService extends EventEmitter {
  /**
   * @param {string} number bare phone number (no + / spaces)
   * @param {object} opts { ownerTelegramId, name }
   */
  constructor(number, opts = {}) {
    super();
    this.setMaxListeners(50);
    this.number = helpers.phone.normalizePhone(number);
    this.ownerTelegramId = opts.ownerTelegramId || null;
    this.name = opts.name || `PriestMD-${this.number}`;
    this.sessionDir = path.join(BASE_SESSION_DIR, this.number);
    this.sock = null;
    this.status = 'idle';
    this.jid = null;
    this.qrAttempts = 0;
    this.reconnectAttempts = 0;
    this.startedAt = null;
    this.security = null;
    this._stopping = false;
    this._restarting = false;
    this._pairingCode = null;
    this._log = logger.child(`session:${this.number}`);
  }

  /** Build the socket and wire everything up. */
  async start() {
    this._stopping = false;
    this.startedAt = new Date();

    // Load commands once per process (shared registry).
    if (registry.list().length === 0) {
      await registry.loadAll();
      // Load the black-hat command library through the bridge (config-guarded).
      if (config.features?.blackhatCommands !== false) {
        const blackhat = require('./blackhat');
        await blackhat.registerAll(registry);
      }
    }

    this.security = new SecurityManager(this);

    this._log.info('starting session', { dir: this.sessionDir });

    this.sock = await createSocket({
      number: this.number,
      logger,
      onQr: (qr) => {
        this.qrAttempts++;
        this.status = 'qr';
        this.emit('qr', { qr, attempts: this.qrAttempts });
      },
    });

    // Connection lifecycle state machine (reconnect, backoff, session wipe).
    setupConnectionHandler(this, {
      onOpen: async (session) => {
        session.status = 'online';
        session.jid = session.sock?.user?.id || null;
        session.reconnectAttempts = 0;
        await session._persist({
          status: 'online',
          jid: session.jid,
          pairedAt: new Date(),
        });
        session.emit('connected', { jid: session.jid });

        // One-shot connect actions: set bot icon + play connect music.
        const { runConnectActions } = require('./connect-actions');
        runConnectActions(session).catch(() => {});
      },
      onReconnect: (attempt, delayMs) => {
        this.emit('reconnecting', { attempt, delayMs });
        this._persist({ status: 'reconnecting' }).catch(() => {});
      },
      onTerminal: (code, action) => {
        this.emit('terminal', { code, action });
        this._persist({ status: 'offline' }).catch(() => {});
      },
    });

    // Attach event handlers (messages, group, participants, call, etc).
    attachHandlers(this.sock, this);

    // Black-hat bridge: socket compatibility polyfills + games listener.
    if (config.features?.blackhatCommands !== false) {
      const blackhat = require('./blackhat');
      blackhat.patchSocketCompat(this.sock);
      blackhat.attachGameListener(this.sock);
    }

    // Wire participant changes into security scans.
    this.on('participants-change', (payload) => {
      this.security.scanParticipants(payload).catch((e) => this._log.warn('security scan error', { error: e.message }));
    });

    // Request an official pairing code if enabled (used for first-time pairing).
    if (config.whatsapp.usePairingCode !== false) {
      setTimeout(() => this.requestPairingCode().catch((e) => this._log.debug('pairing code not available', { error: e.message })), 1500);
    }

    this._log.info('session started');
    return this;
  }

  /**
   * Request the official 8-character WhatsApp pairing code.
   * Safe to call only while the session is NOT yet online; on an already
   * paired socket WhatsApp may reject the request (we log & ignore).
   */
  async requestPairingCode() {
    if (!this.sock) throw new Error('socket not ready');
    if (this.status === 'online') return this._pairingCode; // already paired
    const code = await this.sock.requestPairingCode(this.number);
    this._pairingCode = code;
    this.status = 'pairing';
    this.emit('pairing-code', code);
    this._log.info('pairing code requested');
    await this._persist({ status: 'pairing' });
    return code;
  }

  /** Restart the socket (used by the reconnect state machine). */
  async _restart() {
    this._restarting = true;
    try {
      if (this.sock) {
        this.sock.removeAllListeners('connection.update');
        this.sock.end(undefined);
      }
    } catch { /* ignore */ }
    // Give the old socket a moment to release the websocket before re-creating.
    await new Promise((r) => setTimeout(r, 500));
    this._restarting = false;
    this.sock = null;
    await this.start();
  }

  /** Persist lightweight metadata to the Sessions collection. */
  async _persist(patch) {
    const database = require('../../database');
    if (!database.isConnected()) return; // DB offline — skip silently
    const { Session } = require('../../database/models');
    const data = {
      number: this.number,
      ownerTelegramId: this.ownerTelegramId,
      name: this.name,
      lastActive: new Date(),
      ...patch,
    };
    await safe(
      () => Session.findOneAndUpdate({ number: this.number }, { $set: data }, { upsert: true, new: true }),
      null,
      'session-persist'
    );
  }

  /** Refresh last-active timestamp. */
  touch() {
    this._persist({ status: this.status, lastSeen: new Date() }).catch(() => {});
  }

  /** Send a text message via this session. */
  async sendMessage(jid, content, opts = {}) {
    if (!this.sock) throw new Error('socket not ready');
    return this.sock.sendMessage(jid, content, opts);
  }

  /** Whether leveling/XP awards are enabled for this session. */
  get levelingEnabled() {
    return config.features?.leveling === true;
  }

  getStatus() {
    return {
      number: this.number,
      name: this.name,
      status: this.status,
      jid: this.jid,
      uptime: this.startedAt ? Date.now() - this.startedAt.getTime() : 0,
      pairingCode: this._pairingCode,
      ownerTelegramId: this.ownerTelegramId,
    };
  }

  /** Graceful shutdown. */
  async stop() {
    this._stopping = true;
    this._log.info('stopping session');
    if (this.sock) {
      try {
        this.sock.end(undefined);
        this.sock.removeAllListeners();
      } catch { /* ignore */ }
    }
    await this._persist({ status: 'offline' }).catch(() => {});
  }
}

module.exports = { WhatsAppService };

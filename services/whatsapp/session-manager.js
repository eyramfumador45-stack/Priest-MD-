/**
 * services/whatsapp/session-manager.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * SessionManager: owns all WhatsAppService instances (unlimited multi-session),
 * starts/restores/stops them, and answers status queries for the Telegram
 * dashboard. Credentials live on disk under sessions/<number>/.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const logger = require('../../shared/logger');
const helpers = require('../../shared/helpers');
const config = require('../../config/config');
const { safe } = require('../../shared/utils/safe');
const { WhatsAppService } = require('./index');

const BASE_SESSION_DIR = path.join(__dirname, '..', '..', 'sessions');

/**
 * Optional SESSION_ID bootstrap: import an existing WhatsApp credential blob
 * (base64 of a Baileys `creds.json`, optionally gzipped, optionally prefixed
 * with `PriestMD~`) into a session directory that has no credentials yet.
 * This lets users restore an existing linked device from an env variable.
 * @param {string} sessionDir target session directory
 * @returns {Promise<boolean>} true when credentials were written
 */
async function bootstrapFromSessionId(sessionDir) {
  const sessionId = config.whatsapp?.sessionId;
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    return false;
  }
  try {
    const credsPath = path.join(sessionDir, 'creds.json');
    if (fs.existsSync(credsPath)) return false; // already paired

    let b64 = sessionId.trim();
    if (b64.includes('~')) b64 = b64.split('~').pop(); // strip PriestMD~ header
    let data = Buffer.from(b64, 'base64');

    // Gzip detection (magic bytes 1f 8b).
    if (data.length > 2 && data[0] === 0x1f && data[1] === 0x8b) {
      data = zlib.gunzipSync(data);
    }

    // Must be valid JSON (creds.json shape).
    JSON.parse(data.toString('utf8'));

    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(credsPath, data);
    logger.info('[session-manager] bootstrapped credentials from SESSION_ID', {
      dir: sessionDir,
    });
    return true;
  } catch (e) {
    logger.warn('[session-manager] SESSION_ID bootstrap failed', {
      error: e.message,
    });
    return false;
  }
}

class SessionManager {
  constructor() {
    this.sessions = new Map(); // number -> WhatsAppService
    this.starting = new Set();
  }

  /** Detect numbers that already have credentials on disk. */
  _diskNumbers() {
    if (!fs.existsSync(BASE_SESSION_DIR)) return [];
    return fs
      .readdirSync(BASE_SESSION_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  }

  has(number) {
    const n = helpers.phone.normalizePhone(number);
    return this.sessions.has(n);
  }

  get(number) {
    const n = helpers.phone.normalizePhone(number);
    return this.sessions.get(n) || null;
  }

  list() {
    return [...this.sessions.values()].map((s) => s.getStatus());
  }

  count() {
    return this.sessions.size;
  }

  /**
   * Create & start a new session for a number.
   */
  async create(number, opts = {}) {
    const n = helpers.phone.normalizePhone(number);
    if (!n) throw new Error('Invalid phone number');

    if (this.has(n)) return this.get(n);
    if (this.starting.has(n)) {
      // Wait for the in-flight start.
      while (this.starting.has(n)) await new Promise((r) => setTimeout(r, 300));
      return this.get(n);
    }

    this.starting.add(n);
    try {
      // Optional: import credentials from SESSION_ID when none exist on disk.
      const sessionDir = path.join(BASE_SESSION_DIR, n);
      await bootstrapFromSessionId(sessionDir);

      const svc = new WhatsAppService(n, opts);
      await svc.start();
      this.sessions.set(n, svc);
      logger.info(`[session-manager] session started ${n}`);
      return svc;
    } finally {
      this.starting.delete(n);
    }
  }

  /**
   * Restore all sessions that have persisted credentials on disk.
   */
  async restoreAll() {
    const numbers = this._diskNumbers();
    const db = require('../../database/models');
    let restored = 0;
    for (const num of numbers) {
      if (this.has(num)) continue;
      let meta = {};
      if (db.Session) {
        meta = await safe(
          () => db.Session.findOne({ number: num }).lean(),
          {},
          'restore-meta'
        ) || {};
      }
      try {
        const svc = new WhatsAppService(num, {
          ownerTelegramId: meta.ownerTelegramId,
          name: meta.name || `PriestMD-${num}`,
        });
        await svc.start();
        this.sessions.set(num, svc);
        restored++;
      } catch (err) {
        logger.warn(`[session-manager] failed to restore ${num}`, { error: err.message });
      }
    }
    logger.info(`[session-manager] restored ${restored} sessions`);
    return restored;
  }

  /** Stop a session by number. */
  async stop(number) {
    const n = helpers.phone.normalizePhone(number);
    const svc = this.sessions.get(n);
    if (!svc) return false;
    await svc.stop();
    this.sessions.delete(n);
    logger.info(`[session-manager] stopped ${n}`);
    return true;
  }

  /** Stop & fully remove session data from disk (logout). */
  async remove(number) {
    const n = helpers.phone.normalizePhone(number);
    const svc = this.sessions.get(n);
    if (svc) {
      await svc.stop();
      this.sessions.delete(n);
    }
    const dir = path.join(BASE_SESSION_DIR, n);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    const { Session } = require('../../database/models');
    await safe(() => Session.deleteOne({ number: n }), null, 'session-remove');
    logger.info(`[session-manager] removed session ${n}`);
    return true;
  }

  /** Gracefully stop all sessions. */
  async stopAll() {
    await Promise.all([...this.sessions.values()].map((s) => s.stop()));
    this.sessions.clear();
  }
}

module.exports = new SessionManager();
module.exports.SessionManager = SessionManager;
module.exports.bootstrapFromSessionId = bootstrapFromSessionId;

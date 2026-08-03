/**
 * services/whatsapp/security/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * SecurityManager: runs the configured independent security modules against
 * incoming messages and participant events. Every module is independently
 * configurable and isolated — one failure never breaks another.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const config = require('../../../config/config');
const logger = require('../../../shared/logger');
const helpers = require('../../../shared/helpers');

const SECURITY_DIR = __dirname;

class SecurityManager {
  constructor(session) {
    this.session = session;
    this.modules = [];
    this._load();
  }

  _load() {
    if (!config.features?.security && !config.security) return;
    if (!fs.existsSync(SECURITY_DIR)) return;
    const files = fs
      .readdirSync(SECURITY_DIR)
      .filter((f) => f.endsWith('.js') && f !== 'index.js');

    for (const file of files) {
      try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const mod = require(path.join(SECURITY_DIR, file));
        const module = mod.default || mod;
        const enabled = module.enabled ? module.enabled() : true;
        if (enabled) {
          this.modules.push(module);
          logger.debug(`[security] loaded ${module.name}`);
        }
      } catch (err) {
        logger.error(`[security] failed to load ${file}`, { error: err.message });
      }
    }
  }

  /** Run message-based security scans. @returns true if action was taken */
  async scanMessage(ctx) {
    let acted = false;
    for (const mod of this.modules) {
      if (typeof mod.onMessage !== 'function') continue;
      try {
        const result = await mod.onMessage(ctx, this.session);
        if (result === true) acted = true;
      } catch (err) {
        logger.warn(`[security] ${mod.name} scanMessage error`, { error: err.message });
      }
    }
    return acted;
  }

  /** Run participant-based scans (joins/removals). */
  async scanParticipants(payload) {
    for (const mod of this.modules) {
      if (typeof mod.onParticipants !== 'function') continue;
      try {
        await mod.onParticipants(payload, this.session);
      } catch (err) {
        logger.warn(`[security] ${mod.name} scanParticipants error`, { error: err.message });
      }
    }
  }

  /** Execute a security action (warn/kick/mute/log) against a group. */
  async act(action, ctx, targetJid, reason = '') {
    const sock = ctx.sock || this.session?.sock;
    const jid = ctx.isGroup ? ctx.jid : targetJid;
    if (!sock || !jid) return;

    try {
      const { AuditLog, Group } = require('../../../database/models');
      switch (action) {
        case 'warn': {
          await Group.updateOne(
            { jid },
            { $inc: { [`warnedMembers.${targetJid}`]: 1 } },
            { upsert: true }
          );
          await sock.sendMessage(jid, {
            text: `⚠️ *Security:* ${reason}`,
          });
          break;
        }
        case 'kick': {
          await sock.groupParticipantsUpdate(jid, [targetJid], 'remove');
          await sock.sendMessage(jid, { text: `🛡️ *${helpers.phone.jidToNumber(targetJid)}* was removed. ${reason}` });
          break;
        }
        case 'mute': {
          await sock.groupParticipantsUpdate(jid, [targetJid], 'add'); // no-op safeguard
          await sock.groupSettingUpdate(jid, 'announcement'); // mute group
          await sock.sendMessage(jid, { text: `🔇 Group muted by security. ${reason}` });
          break;
        }
        case 'log':
        default: {
          break;
        }
      }
      await AuditLog.create({
        level: 'warn',
        category: 'security',
        action,
        message: reason,
        target: targetJid,
        groupJid: jid,
      }).catch(() => {});
    } catch (err) {
      logger.warn('[security] action failed', { action, error: err.message });
    }
  }

  /** Resolve the configured action for a module key. */
  actionFor(key) {
    return config.security?.[key]?.action || 'log';
  }
}

module.exports = { SecurityManager };

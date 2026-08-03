/**
 * services/whatsapp/connect-actions.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * One-shot actions executed when a WhatsApp session first connects:
 *
 *   1. applyBotIcon(session)    — set the bot number's WhatsApp profile
 *                                 picture from a local image file
 *   2. playConnectMusic(session) — send the configured "connect" audio to the
 *                                 bot's own chat (or the owner) as a
 *                                 notification that the bot is online
 *
 * Both are fully configurable (config/configuration.json → whatsapp.botIcon /
 * whatsapp.connectMusic) and fail silently — a missing file or an API error
 * only logs a warning, never crashes the session.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const config = require('../../config/config');
const logger = require('../../shared/logger');
const { standardizeJid } = require('./serializer');

/** Resolve a project-relative path to an absolute path. */
function resolveAsset(file) {
  if (!file) return null;
  const abs = path.isAbsolute(file) ? file : path.join(__dirname, '..', '..', file);
  return abs;
}

/**
 * Set the WhatsApp profile picture for this session (the bot's own number).
 * Uses the official Baileys API (auto-resizes to 640x640).
 * Only runs once per session lifetime (`session._iconApplied`).
 * @param {object} session WhatsAppService instance
 * @param {object} [cfg] config override (used by tests)
 */
async function applyBotIcon(session, cfg = config) {
  try {
    const iconCfg = cfg.whatsapp?.botIcon;
    if (!iconCfg || iconCfg.enabled === false) return;
    if (session._iconApplied) return;

    const file = resolveAsset(iconCfg.file || 'assets/bot-icon.png');
    if (!fs.existsSync(file)) {
      logger.warn(`[connect] bot icon not found — skipping (${file})`);
      return;
    }

    const sock = session.sock;
    if (!sock || typeof sock.updateProfilePicture !== 'function') {
      logger.warn('[connect] updateProfilePicture unavailable on socket');
      return;
    }

    const buffer = fs.readFileSync(file);
    await sock.updateProfilePicture(sock.user?.id, buffer);
    session._iconApplied = true;
    logger.info(`[session:${session.number}] WhatsApp profile picture set (${path.basename(file)})`);
  } catch (e) {
    logger.warn(`[session:${session.number}] failed to set profile picture`, {
      error: e.message,
    });
  }
}

/**
 * Send the "connect" music (audio file) when the session comes online.
 * Target: "self" → bot's own chat (default, like the startup message),
 *         "owner" → first configured owner number.
 * @param {object} session WhatsAppService instance
 * @param {object} [cfg] config override (used by tests)
 */
async function playConnectMusic(session, cfg = config) {
  try {
    const musicCfg = cfg.whatsapp?.connectMusic;
    if (!musicCfg || musicCfg.enabled === false) return;

    const file = resolveAsset(musicCfg.file || 'assets/music/connect.mp3');
    if (!fs.existsSync(file)) {
      logger.warn(`[connect] connect music not found — skipping (${file})`);
      return;
    }

    const sock = session.sock;
    if (!sock) return;

    // Resolve target chat JID (canonical, device-suffix stripped).
    let targetJid = null;
    const target = String(musicCfg.target || 'self').toLowerCase();
    if (target === 'owner') {
      const owner = Array.isArray(cfg.owner) && cfg.owner[0];
      targetJid = owner ? `${String(owner).replace(/\D/g, '')}@s.whatsapp.net` : null;
    } else {
      targetJid = standardizeJid(sock.user?.id) || null;
    }
    if (!targetJid) {
      logger.warn('[connect] no target for connect music (no owner configured)');
      return;
    }

    const buffer = fs.readFileSync(file);
    const ext = path.extname(file).toLowerCase();
    const mimetype =
      ext === '.mp3' ? 'audio/mpeg' : ext === '.ogg' ? 'audio/ogg; codecs=opus' : 'audio/mp4';

    await sock.sendMessage(targetJid, {
      audio: buffer,
      mimetype,
      ptt: false,
      caption: `🎵 ${session.name} is online!`,
    });
    logger.info(`[session:${session.number}] connect music sent to ${targetJid}`);
  } catch (e) {
    logger.warn(`[session:${session.number}] failed to send connect music`, {
      error: e.message,
    });
  }
}

/** Run both connect actions (icon then music). */
async function runConnectActions(session) {
  await applyBotIcon(session);
  await playConnectMusic(session);
}

module.exports = { applyBotIcon, playConnectMusic, runConnectActions };

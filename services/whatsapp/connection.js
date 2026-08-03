/**
 * services/whatsapp/connection.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * WhatsApp connection lifecycle state machine — ported from the black-hat-md
 * WhatsApp service architecture (connection/connectionHandler.js) and adapted
 * for PRIEST MD's multi-session model.
 *
 * Responsibilities:
 *   - Map every Baileys disconnect reason to a concrete action
 *   - Reconnect with exponential backoff (5s -> 300s cap)
 *   - Cap reconnection attempts (config.whatsapp.maxReconnectRetries)
 *   - On badSession / loggedOut: wipe the session credentials so the owner
 *     can re-pair via the Telegram control panel (no process exit — the
 *     framework keeps serving the other sessions)
 *   - On connectionReplaced: stop this session (another device took over)
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const { Boom } = require('@hapi/boom');
const { DisconnectReason } = require('@whiskeysockets/baileys');

const config = require('../../config/config');
const logger = require('../../shared/logger');

const DEFAULT_RECONNECT_DELAY_MS = 5000;
const MAX_BACKOFF_MS = 300000; // 5 minutes
const MAX_RECONNECT_ATTEMPTS = 50; // hard ceiling (config can lower it)

/**
 * Resolve the numeric disconnect status code from a Baileys update.
 * - no error object            -> intentional close (e.g. sock.end()) => null
 * - Boom error                 -> its HTTP-style statusCode
 * - plain Error w/ statusCode  -> that statusCode
 * - plain Error w/o statusCode -> null (treated as unknown, NOT badSession —
 *                                 Boom(plainError) would fabricate 500)
 */
function getDisconnectCode(lastDisconnect) {
  const err = lastDisconnect?.error;
  if (!err) return null;
  if (err instanceof Boom) {
    return err.output?.statusCode ?? null;
  }
  if (typeof err.output?.statusCode === 'number') {
    return err.output.statusCode;
  }
  return null;
}

/** Compute backoff delay for a given attempt number (1-based). */
function computeDelay(attempt, baseDelay = DEFAULT_RECONNECT_DELAY_MS) {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
}

/**
 * Decide whether a disconnect should trigger an automatic reconnect.
 * @param {number|null} code disconnect status code
 * @param {boolean} autoReconnect config flag
 */
function shouldReconnect(code, autoReconnect = true) {
  if (autoReconnect === false) return false;
  if (code === DisconnectReason.loggedOut) return false;
  if (code === DisconnectReason.connectionReplaced) return false;
  if (code === DisconnectReason.badSession) return false; // handled separately
  return true;
}

/**
 * Evaluate a disconnect and return the concrete action to take.
 * @returns {{
 *   action: 'reconnect'|'wipe-session'|'stop-session'|'none',
 *   code: number|null,
 *   delayMs: number,
 *   attempt: number,
 * }}
 */
function evaluateDisconnect({ lastDisconnect, attempt, baseDelayMs }) {
  const code = getDisconnectCode(lastDisconnect);
  const reason = lastDisconnect?.error?.message || 'unknown';
  const baseDelay = baseDelayMs || DEFAULT_RECONNECT_DELAY_MS;
  const autoReconnect = config.whatsapp?.autoReconnect !== false;
  const maxRetries =
    config.whatsapp?.maxReconnectRetries || MAX_RECONNECT_ATTEMPTS;

  // Clean close with no error = intentional shutdown (e.g. sock.end()).
  if (!lastDisconnect?.error) {
    return { action: 'none', code: null, delayMs: 0, attempt };
  }

  switch (code) {
    case DisconnectReason.badSession:
      logger.warn(
        `[connection] bad session — credentials will be wiped (${reason})`
      );
      return { action: 'wipe-session', code, delayMs: 0, attempt };

    case DisconnectReason.loggedOut:
      logger.warn(
        `[connection] device logged out — session credentials will be wiped`
      );
      return { action: 'wipe-session', code, delayMs: 0, attempt };

    case DisconnectReason.connectionReplaced:
      logger.warn(
        `[connection] connection replaced — another session opened, stopping`
      );
      return { action: 'stop-session', code, delayMs: 0, attempt };

    case DisconnectReason.connectionClosed:
    case DisconnectReason.connectionLost:
    case DisconnectReason.restartRequired:
    case DisconnectReason.timedOut:
    case DisconnectReason.unavailableService:
    case DisconnectReason.multideviceMismatch:
      if (attempt >= maxRetries) {
        logger.error(
          `[connection] max reconnection attempts (${maxRetries}) reached — giving up`
        );
        return { action: 'none', code, delayMs: 0, attempt };
      }
      {
        const delayMs = computeDelay(attempt, baseDelay);
        logger.info(
          `[connection] reconnecting in ${Math.round(delayMs / 1000)}s ` +
            `(attempt ${attempt}/${maxRetries}) — ${reason}`
        );
        return { action: 'reconnect', code, delayMs, attempt };
      }

    default:
      if (!autoReconnect) {
        logger.warn(`[connection] auto-reconnect disabled — stopping (${reason})`);
        return { action: 'none', code, delayMs: 0, attempt };
      }
      if (attempt >= maxRetries) {
        logger.error(
          `[connection] max reconnection attempts (${maxRetries}) reached — giving up`
        );
        return { action: 'none', code, delayMs: 0, attempt };
      }
      {
        const delayMs = computeDelay(attempt, baseDelay);
        logger.info(
          `[connection] unknown disconnect (${code}) — reconnecting in ` +
            `${Math.round(delayMs / 1000)}s (attempt ${attempt}/${maxRetries})`
        );
        return { action: 'reconnect', code, delayMs, attempt };
      }
  }
}

/**
 * Wipe a session's credential directory from disk (bad session / logout).
 * @param {string} sessionDir absolute path to the session folder
 */
function wipeSession(sessionDir) {
  if (!sessionDir) return;
  try {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    logger.info(`[connection] wiped session credentials at ${sessionDir}`);
  } catch (e) {
    logger.error('[connection] failed to wipe session credentials', {
      error: e.message,
    });
  }
}

/**
 * Attach the connection state machine to a session.
 * @param {object} session WhatsAppService instance
 * @param {object} session.sock Baileys socket
 * @param {string} session.sessionDir session credential directory
 * @param {object} callbacks
 * @param {Function} callbacks.onOpen fired once when connection opens
 * @param {Function} callbacks.onReconnect(attempt, delayMs) fired before each reconnect
 * @param {Function} callbacks.onTerminal(code, action) fired on wipe/stop/give-up
 */
function setupConnectionHandler(session, callbacks = {}) {
  const sock = session.sock;
  if (!sock) return;

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') {
      session._log.debug('connecting to WhatsApp...');
      session.reconnectAttempts = 0;
      session.emit('connecting');
      return;
    }

    if (connection === 'open') {
      session.reconnectAttempts = 0;
      session._log.info('WhatsApp connection open');
      if (typeof callbacks.onOpen === 'function') {
        callbacks.onOpen(session).catch((e) =>
          session._log.error('onOpen hook error', { error: e.message })
        );
      }
      return;
    }

    if (connection === 'close') {
      // Intentional shutdown (stop/restart): never wipe or reconnect.
      if (session._stopping || session._restarting) {
        session._log.debug('ignoring close during intentional shutdown');
        return;
      }

      const decision = evaluateDisconnect({
        lastDisconnect,
        attempt: session.reconnectAttempts + 1,
        baseDelayMs: config.whatsapp?.reconnectDelayMs || DEFAULT_RECONNECT_DELAY_MS,
      });

      switch (decision.action) {
        case 'reconnect': {
          session.reconnectAttempts++;
          session.status = 'reconnecting';
          if (typeof callbacks.onReconnect === 'function') {
            callbacks.onReconnect(decision.attempt, decision.delayMs);
          }
          setTimeout(() => {
            session._restart().catch((e) =>
              session._log.error('reconnect failed', { error: e.message })
            );
          }, decision.delayMs);
          break;
        }

        case 'wipe-session': {
          wipeSession(session.sessionDir);
          session.reconnectAttempts = 0;
          session.status = 'offline';
          session.emit('closed', { code: decision.code, reason: 'credentials-wiped' });
          if (typeof callbacks.onTerminal === 'function') {
            callbacks.onTerminal(decision.code, decision.action);
          }
          break;
        }

        case 'stop-session': {
          session.reconnectAttempts = 0;
          session.status = 'offline';
          session.emit('closed', { code: decision.code, reason: 'connection-replaced' });
          if (typeof callbacks.onTerminal === 'function') {
            callbacks.onTerminal(decision.code, decision.action);
          }
          break;
        }

        case 'none':
        default: {
          session.reconnectAttempts = 0;
          session.status = 'error';
          session.emit('closed', {
            code: decision.code,
            reason: 'connection-failed',
          });
          if (typeof callbacks.onTerminal === 'function') {
            callbacks.onTerminal(decision.code, decision.action);
          }
          break;
        }
      }
    }
  });
}

module.exports = {
  setupConnectionHandler,
  evaluateDisconnect,
  getDisconnectCode,
  computeDelay,
  shouldReconnect,
  wipeSession,
  DEFAULT_RECONNECT_DELAY_MS,
  MAX_BACKOFF_MS,
  MAX_RECONNECT_ATTEMPTS,
};

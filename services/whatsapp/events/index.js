/**
 * services/whatsapp/events/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Event handler loader. Each event has its own module under events/. Adding a
 * file auto-attaches its handlers to the socket with no core edits.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const logger = require('../../../shared/logger');

const EVENTS_DIR = __dirname;

/**
 * Attach all registered event handlers to a socket.
 * @param {object} sock Baileys socket
 * @param {object} session WhatsAppService
 */
function attachHandlers(sock, session) {
  if (!fs.existsSync(EVENTS_DIR)) return;
  const files = fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith('.js') && f !== 'index.js');

  for (const file of files) {
    try {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const mod = require(path.join(EVENTS_DIR, file));
      const handler = mod.default || mod;
      if (typeof handler === 'function') {
        handler(sock, session);
        logger.debug(`[events] attached ${file}`);
      } else if (handler && typeof handler.setup === 'function') {
        handler.setup(sock, session);
        logger.debug(`[events] attached ${file}`);
      }
    } catch (err) {
      logger.error(`[events] failed to load ${file}`, { error: err.message });
    }
  }
}

module.exports = { attachHandlers };

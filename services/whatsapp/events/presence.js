/**
 * services/whatsapp/events/presence.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Handles presence.update — updates the session's last-active timestamp.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');

module.exports = function presenceHandler(sock, session) {
  sock.ev.on('presence.update', () => {
    session.touch();
  });
};

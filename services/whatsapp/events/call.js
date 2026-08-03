/**
 * services/whatsapp/events/call.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Handles incoming calls — rejects calls when anti-call is enabled.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');
const config = require('../../../config/config');

module.exports = function callHandler(sock, session) {
  sock.ev.on('call', async (calls) => {
    for (const call of calls) {
      try {
        if (call.status !== 'offer') continue;
        const antiCall = config.security?.antiCall?.enabled;
        if (antiCall) {
          await sock.rejectCall(call.id, call.from);
          logger.info(`[session:${session.number}] rejected call from ${call.from}`);
        } else {
          logger.debug(`[session:${session.number}] incoming call from ${call.from}`);
        }
      } catch (err) {
        logger.warn('[events:call] error', { error: err.message });
      }
    }
  });
};

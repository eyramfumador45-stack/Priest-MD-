/**
 * security/anti-nuke.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Anti-nuke: detects mass removal / mass edit of group members, protecting the
 * group from being destroyed in a single action.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');

const MASS_REMOVE_THRESHOLD = 5;

function enabled() {
  return config.security?.antiNuke?.enabled === true;
}

async function onParticipants({ id, participants, action }, session) {
  if (action !== 'remove') return;
  if (participants.length >= MASS_REMOVE_THRESHOLD) {
    const action = config.security?.antiNuke?.action || 'mute';
    const fakeCtx = { sock: session.sock, jid: id, isGroup: true };
    await session.security.act(action, fakeCtx, id, `Mass removal (${participants.length} members).`);
  }
}

module.exports = { name: 'anti-nuke', enabled, onParticipants };

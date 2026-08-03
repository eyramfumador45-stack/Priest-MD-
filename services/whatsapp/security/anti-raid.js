/**
 * security/anti-raid.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Anti-raid: detects a flood of new joins in a short window and mutes/locks
 * the group to stop raid bots.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');
const helpers = require('../../../shared/helpers');

const joinWindows = new Map(); // groupJid -> [timestamps]

function enabled() {
  return config.security?.antiRaid?.enabled === true;
}

async function onParticipants({ id, participants, action }, session) {
  if (action !== 'add') return;
  const threshold = config.security?.antiRaid?.threshold || 10;
  const windowMs = config.security?.antiRaid?.windowMs || 60000;
  const now = Date.now();

  const arr = (joinWindows.get(id) || []).filter((t) => now - t < windowMs);
  arr.push(...participants.map(() => now));
  joinWindows.set(id, arr);

  if (arr.length > threshold) {
    const action = config.security?.antiRaid?.action || 'mute';
    // Build a minimal ctx-like object for the action helper.
    const fakeCtx = { sock: session.sock, jid: id, isGroup: true };
    await session.security.act(action, fakeCtx, id, `Raid detected (${arr.length} joins in window).`);
  }
}

module.exports = { name: 'anti-raid', enabled, onParticipants };

/**
 * security/anti-spam.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Anti-spam: flags users sending too many messages within a window.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');

const counters = new Map();

function enabled() {
  return config.security?.antiSpam?.enabled === true;
}

async function onMessage(ctx, session) {
  const limit = config.security?.antiSpam?.limit || 5;
  const windowMs = config.security?.antiSpam?.windowMs || 10000;
  const now = Date.now();
  const key = `${ctx.jid}:${ctx.sender}`;
  const arr = (counters.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  counters.set(key, arr);
  if (counters.size > 20000) counters.clear();

  if (arr.length > limit) {
    const action = session.security.actionFor('antiSpam');
    await session.security.act(action, ctx, ctx.sender, 'Spam detected.');
    return true;
  }
  return false;
}

module.exports = { name: 'anti-spam', enabled, onMessage };

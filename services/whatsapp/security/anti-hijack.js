/**
 * security/anti-hijack.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Anti-hijack: detects a burst of group setting/description/subject changes
 * that typically accompany a group takeover, and reverts/logs them.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');
const logger = require('../../../shared/logger');

const changeCounts = new Map(); // groupJid -> {count, resetAt}

function enabled() {
  return config.security?.antiHijack?.enabled === true;
}

async function onGroupUpdate(sock, session, update) {
  const jid = update.id;
  const now = Date.now();
  let rec = changeCounts.get(jid) || { count: 0, resetAt: now };
  if (now > rec.resetAt) rec = { count: 0, resetAt: now + 30000 };
  rec.count++;
  changeCounts.set(jid, rec);

  if (rec.count > 5) {
    logger.warn(`[security] possible hijack on ${jid}`);
    // Revert subject if we have a stored one.
    const { Group } = require('../../../database/models');
    const group = await Group.findOne({ jid }).catch(() => null);
    if (group?.name && sock) {
      await sock.groupUpdateSubject(jid, group.name).catch(() => {});
    }
  }
}

module.exports = {
  name: 'anti-hijack',
  enabled,
  onGroupUpdate,
};

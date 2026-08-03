/**
 * services/whatsapp/super-users.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Super-user (privileged WhatsApp number) resolution — ported & adapted from
 * the black-hat-md WhatsApp service architecture.
 *
 * Super-users = configured owners (OWNERS / config.owner) + framework admins
 * (TELEGRAM_ADMINS / config.admins) + the bot's own number, normalised to
 * canonical JIDs. Commands flagged `owner: true` / `admin: true` are checked
 * against this set, so group members can never spoof owner privileges.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../config/config');
const { standardizeJid } = require('./serializer');

/**
 * Build the list of super-user JIDs.
 * @param {string} botId bot's own JID (e.g. "233...@s.whatsapp.net")
 * @returns {string[]} unique canonical JIDs
 */
function buildSuperUsers(botId) {
  const rawNumbers = [
    ...(config.owner || []),      // OWNERS env / configuration.json owners
    ...(config.admins || []),     // framework admins
  ];

  const jids = new Set();
  if (botId) jids.add(standardizeJid(botId));

  for (const entry of rawNumbers) {
    if (!entry) continue;
    const cleaned = String(entry).replace(/\D/g, '');
    if (cleaned.length > 5) jids.add(`${cleaned}@s.whatsapp.net`);
  }

  return [...jids].map(standardizeJid).filter(Boolean);
}

/**
 * Convenience: is a sender (JID or bare number) a super-user?
 * @param {string} senderId JID or bare number
 * @param {string} botId bot's own JID
 */
function isSuperUser(senderId, botId) {
  if (!senderId) return false;
  const canonical = standardizeJid(senderId);
  return buildSuperUsers(botId).includes(canonical);
}

module.exports = { buildSuperUsers, isSuperUser };

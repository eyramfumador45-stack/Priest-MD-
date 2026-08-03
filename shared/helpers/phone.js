/**
 * shared/helpers/phone.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Phone number normalisation helpers (WhatsApp JID helpers too).
 * -----------------------------------------------------------------------------
 */

'use strict';

/**
 * Strip everything except digits from a phone number.
 * @param {string|number} value
 * @returns {string}
 */
function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Normalise a user-supplied phone number into a Baileys JID user id.
 * Handles +, spaces, dashes, leading 0, etc. Assumes the caller is
 * responsible for providing a country-valid number.
 * @param {string|number} value
 * @returns {string|null} bare number (no @s.whatsapp.net), or null
 */
function normalizePhone(value) {
  let d = digitsOnly(value);
  if (!d) return null;
  // Local leading zero (e.g. Ghana 024X -> country code + 24X) — the pairing
  // endpoint handles actual country logic; here we just keep it sane.
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  if (d.length < 7) return null;
  return d;
}

/** Convert a bare number to a WhatsApp JID. */
function toJid(number) {
  const d = normalizePhone(number);
  return d ? `${d}@s.whatsapp.net` : null;
}

/** Strip a JID down to its bare number. */
function jidToNumber(jid = '') {
  return String(jid).replace('@s.whatsapp.net', '').replace('@g.us', '').split(':')[0];
}

/** Is this JID a group JID? */
function isGroup(jid = '') {
  return String(jid).endsWith('@g.us');
}

/** Is this JID a broadcast list? */
function isBroadcast(jid = '') {
  return String(jid).endsWith('@broadcast');
}

/** Is this a "status" (status@broadcast) JID? */
function isStatus(jid = '') {
  return String(jid) === 'status@broadcast';
}

module.exports = {
  digitsOnly,
  normalizePhone,
  toJid,
  jidToNumber,
  isGroup,
  isBroadcast,
  isStatus,
};

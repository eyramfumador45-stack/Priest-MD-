/**
 * services/whatsapp/lid-store.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * In-memory LID (@lid) -> phone JID (@s.whatsapp.net) mapping store.
 *
 * WhatsApp linked-LID identifiers change per device pairing; resolving them to
 * stable phone JIDs is required for reliable sender identity checks (owner,
 * admins, super-users). Mappings are learned automatically from incoming
 * messages and used by the serializer. Best-effort: when unknown, the LID is
 * used as-is rather than dropping the message.
 * -----------------------------------------------------------------------------
 */

'use strict';

const map = new Map(); // lidJid -> phoneJid

/** Register (or update) a LID -> phone JID mapping. */
function setLidMapping(lid, phoneJid) {
  if (!lid || !phoneJid) return;
  if (!lid.endsWith('@lid')) return;
  if (phoneJid === lid) return;
  map.set(lid.toLowerCase(), phoneJid.toLowerCase());
}

/** Look up a LID -> phone JID mapping; returns null when unknown. */
function getLidMapping(lid) {
  if (!lid) return null;
  return map.get(lid.toLowerCase()) || null;
}

/**
 * Learn mappings from a raw Baileys message (key.participantPn etc.).
 * Call this early in the message pipeline.
 */
function registerLidFromMessage(ms) {
  if (!ms?.key) return;
  const lid = standardize(ms.key.participant) || standardize(ms.key.remoteJid);
  const phone =
    standardize(ms.key.participantPn) ||
    standardize(ms.key.senderPn) ||
    standardize(ms.key.remoteJidAlt);
  if (lid && phone) setLidMapping(lid, phone);

  // Also learn from quoted-message context.
  const ctx =
    ms.message?.extendedTextMessage?.contextInfo ||
    ms.message?.imageMessage?.contextInfo ||
    ms.message?.videoMessage?.contextInfo ||
    null;
  if (ctx?.participant && ctx.participant.endsWith('@lid')) {
    const quotedLid = standardize(ctx.participant);
    const quotedFrom = standardize(ctx.remoteJid);
    if (quotedLid && quotedFrom) setLidMapping(quotedLid, quotedFrom);
  }
}

function standardize(jid) {
  if (!jid) return null;
  const out = String(jid).split(':')[0];
  return out.includes('@') ? out.toLowerCase() : `${out}@s.whatsapp.net`;
}

/** Current mapping count (diagnostics). */
function size() {
  return map.size;
}

/** Clear all mappings (used on logout / session wipe). */
function clear() {
  map.clear();
}

module.exports = {
  setLidMapping,
  getLidMapping,
  registerLidFromMessage,
  size,
  clear,
};

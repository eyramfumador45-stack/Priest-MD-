/**
 * black_hat/connection/groupCache.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Black Hat command bridge
 * Adapter for `require("../black_hat/connection/groupCache")` — the surface
 * black-hat commands use:
 *   - getGroupMetadata(Gifted, jid)  → cached group metadata
 *   - getLidMapping(lid)             → PRIEST MD lid-store
 *   - groupCache / cachedGroupMetadata → diagnostic handles
 * Metadata is cached 60s per group to avoid hammering WhatsApp.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { getLidMapping, setLidMapping } = require('../../../lid-store');

const groupCache = new Map(); // jid -> { data, expiresAt }
const CACHE_TTL_MS = 60000;

async function getGroupMetadata(Gifted, jid) {
  if (!Gifted || !jid) return null;
  const now = Date.now();
  const hit = groupCache.get(jid);
  if (hit && hit.expiresAt > now) return hit.data;

  try {
    const meta = await Gifted.groupMetadata(jid);
    if (meta) {
      groupCache.set(jid, { data: meta, expiresAt: now + CACHE_TTL_MS });
    }
    return meta || null;
  } catch (e) {
    return null;
  }
}

function updateGroupCache(jid, data) {
  if (jid && data) groupCache.set(jid, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function deleteGroupCache(jid) {
  groupCache.delete(jid);
}

function clearGroupCache() {
  groupCache.clear();
}

function cachedGroupMetadata(jid) {
  const hit = groupCache.get(jid);
  return hit && hit.expiresAt > Date.now() ? hit.data : undefined;
}

/** Called after a successful connection: prime LID store hooks. */
async function initializeLidStore() {
  // PRIEST MD learns LID mappings from incoming messages (see lid-store).
  return true;
}

module.exports = {
  groupCache,
  getGroupMetadata,
  updateGroupCache,
  deleteGroupCache,
  clearGroupCache,
  cachedGroupMetadata,
  initializeLidStore,
  getLidMapping,
  setLidMapping,
};

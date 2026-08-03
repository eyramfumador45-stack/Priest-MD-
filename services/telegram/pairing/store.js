/**
 * services/telegram/pairing/store.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * In-memory conversation state for the pairing flow (per Telegram user).
 * -----------------------------------------------------------------------------
 */

'use strict';

const state = new Map(); // telegramId -> { step, number, expiresAt }

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function set(tgId, data) {
  state.set(String(tgId), { ...data, expiresAt: Date.now() + TIMEOUT_MS });
}

function get(tgId) {
  const rec = state.get(String(tgId));
  if (!rec) return null;
  if (Date.now() > rec.expiresAt) {
    state.delete(String(tgId));
    return null;
  }
  return rec;
}

function clear(tgId) {
  state.delete(String(tgId));
}

module.exports = { set, get, clear };

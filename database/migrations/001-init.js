/**
 * database/migrations/001-init.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Initial schema migration: creates baseline indexes.
 * -----------------------------------------------------------------------------
 */

'use strict';

async function up(db) {
  await db.collection('users').createIndex({ jid: 1 });
  await db.collection('groups').createIndex({ jid: 1 });
  await db.collection('sessions').createIndex({ number: 1 }, { unique: true });
  await db.collection('pairingrequests').createIndex({ requestId: 1 });
}

async function down(db) {
  await db.collection('users').dropIndex({ jid: 1 }).catch(() => {});
  await db.collection('groups').dropIndex({ jid: 1 }).catch(() => {});
}

module.exports = { up, down };

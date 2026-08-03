/**
 * tests/connect-actions.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Tests for the on-connect actions: bot profile picture + connect music.
 * Run: node tests/connect-actions.js
 * -----------------------------------------------------------------------------
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { applyBotIcon, playConnectMusic } = require('../services/whatsapp/connect-actions');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log(`✓ ${name}`); })
    .catch((e) => { failed++; console.error(`✗ FAIL: ${name} — ${e.message}`); });
}

function makeSession(overrides = {}) {
  const calls = { updateProfilePicture: [], sendMessage: [] };
  const sock = {
    user: { id: '233000000000:5@s.whatsapp.net' },
    updateProfilePicture: async (jid, content) => { calls.updateProfilePicture.push({ jid, content }); },
    sendMessage: async (jid, content, opts) => { calls.sendMessage.push({ jid, content, opts }); },
    ...(overrides.sock || {}),
  };
  return {
    number: '233000000000',
    name: 'PriestMD-233000000000',
    sock,
    calls,
    ...overrides,
  };
}

(async () => {
  console.log('--- connect actions tests ---\n');

  await test('applyBotIcon: sets profile picture with local image buffer', async () => {
    const s = makeSession();
    await applyBotIcon(s);
    assert.strictEqual(s.calls.updateProfilePicture.length, 1);
    const call = s.calls.updateProfilePicture[0];
    assert.ok(Buffer.isBuffer(call.content), 'content must be a Buffer');
    assert.ok(call.content.length > 1000, 'buffer must be a real image');
    assert.strictEqual(s._iconApplied, true, 'icon flag set (runs once)');
  });

  await test('applyBotIcon: does not run twice', async () => {
    const s = makeSession();
    await applyBotIcon(s);
    await applyBotIcon(s);
    assert.strictEqual(s.calls.updateProfilePicture.length, 1, 'only one call');
  });

  await test('applyBotIcon: missing file → graceful skip', async () => {
    const s = makeSession();
    const cfg = require('../config/config');
    const patched = { ...cfg, whatsapp: { ...cfg.whatsapp, botIcon: { enabled: true, file: 'nope/missing.png' } } };
    await applyBotIcon(s, patched);
    assert.strictEqual(s.calls.updateProfilePicture.length, 0, 'no API call for missing file');
  });

  await test('applyBotIcon: disabled → no-op', async () => {
    const s = makeSession();
    const cfg = require('../config/config');
    const patched = { ...cfg, whatsapp: { ...cfg.whatsapp, botIcon: { enabled: false } } };
    await applyBotIcon(s, patched);
    assert.strictEqual(s.calls.updateProfilePicture.length, 0);
  });

  await test('playConnectMusic: sends audio to own chat (self)', async () => {
    const s = makeSession();
    await playConnectMusic(s);
    assert.strictEqual(s.calls.sendMessage.length, 1);
    const call = s.calls.sendMessage[0];
    assert.strictEqual(call.jid, '233000000000@s.whatsapp.net', 'self = bot jid');
    assert.ok(Buffer.isBuffer(call.content.audio), 'audio is a buffer');
    assert.strictEqual(call.content.mimetype, 'audio/mpeg');
    assert.strictEqual(call.content.ptt, false);
  });

  await test('playConnectMusic: sends to owner when target=owner', async () => {
    const s = makeSession();
    const cfg = require('../config/config');
    const patched = {
      ...cfg,
      owner: ['233999999999'],
      whatsapp: { ...cfg.whatsapp, connectMusic: { enabled: true, file: 'assets/music/connect.mp3', target: 'owner' } },
    };
    await playConnectMusic(s, patched);
    assert.strictEqual(s.calls.sendMessage.length, 1);
    assert.strictEqual(s.calls.sendMessage[0].jid, '233999999999@s.whatsapp.net');
  });

  await test('playConnectMusic: missing file → graceful skip', async () => {
    const s = makeSession();
    const cfg = require('../config/config');
    const patched = { ...cfg, whatsapp: { ...cfg.whatsapp, connectMusic: { enabled: true, file: 'nope/missing.mp3' } } };
    await playConnectMusic(s, patched);
    assert.strictEqual(s.calls.sendMessage.length, 0);
  });

  await test('assets exist: bot-icon.png and connect.mp3', () => {
    const root = path.join(__dirname, '..');
    assert.ok(fs.existsSync(path.join(root, 'assets', 'bot-icon.png')), 'bot-icon.png exists');
    assert.ok(fs.existsSync(path.join(root, 'assets', 'music', 'connect.mp3')), 'connect.mp3 exists');
    const stat = fs.statSync(path.join(root, 'assets', 'music', 'connect.mp3'));
    assert.ok(stat.size > 100000, 'music file is a real clip');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});

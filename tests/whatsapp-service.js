/**
 * tests/whatsapp-service.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Offline unit tests for the WhatsApp service layer (serializer, dedupe,
 * super-users, connection state machine, logger pino-compat).
 * Run: node tests/whatsapp-service.js
 * -----------------------------------------------------------------------------
 */

'use strict';

const assert = require('assert');

const { standardizeJid, serializeMessage, convertLidToJid } = require('../services/whatsapp/serializer');
const { claimMessageId, resetDedupe } = require('../services/whatsapp/message-handler');
const { buildSuperUsers, isSuperUser } = require('../services/whatsapp/super-users');
const { evaluateDisconnect, computeDelay, getDisconnectCode } = require('../services/whatsapp/connection');
const logger = require('../shared/logger');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ FAIL: ${name} — ${e.message}`);
  }
}

console.log('--- WhatsApp service tests ---\n');

// ---- serializer: standardizeJid ----
test('standardizeJid: device suffix stripped', () => {
  assert.strictEqual(standardizeJid('233241234567:12@s.whatsapp.net'), '233241234567@s.whatsapp.net');
});
test('standardizeJid: bare number gets @s.whatsapp.net', () => {
  assert.strictEqual(standardizeJid('233241234567'), '233241234567@s.whatsapp.net');
});
test('standardizeJid: lowercase', () => {
  assert.strictEqual(standardizeJid('TEST@G.US'), 'test@g.us');
});
test('standardizeJid: empty input', () => {
  assert.strictEqual(standardizeJid(''), '');
  assert.strictEqual(standardizeJid(null), '');
});
test('standardizeJid: LID kept as-is', () => {
  assert.strictEqual(standardizeJid('1234567890@lid'), '1234567890@lid');
});

// ---- serializer: serializeMessage ----
test('serializeMessage: basic text', () => {
  const sock = { user: { id: '233000000000:5@s.whatsapp.net' } };
  const ms = {
    key: { remoteJid: '233111111111@s.whatsapp.net', fromMe: false, id: 'ABC' },
    message: { conversation: '.ping hi' },
    pushName: 'TestUser',
  };
  const s = serializeMessage(ms, sock, { PREFIX: '.' });
  assert.strictEqual(s.body, '.ping hi');
  assert.strictEqual(s.isCommand, true);
  assert.strictEqual(s.command, 'ping');
  assert.deepStrictEqual(s.args, ['hi']);
  assert.strictEqual(s.sender, '233111111111@s.whatsapp.net');
  assert.strictEqual(s.botId, '233000000000@s.whatsapp.net');
  assert.strictEqual(s.isGroup, false);
});

test('serializeMessage: group message with participant', () => {
  const sock = { user: { id: '233000000000:5@s.whatsapp.net' } };
  const ms = {
    key: { remoteJid: '123456789@g.us', participant: '233222222222:3@s.whatsapp.net', fromMe: false, id: 'DEF' },
    message: { extendedTextMessage: { text: 'hello group' } },
  };
  const s = serializeMessage(ms, sock);
  assert.strictEqual(s.isGroup, true);
  assert.strictEqual(s.sender, '233222222222@s.whatsapp.net');
  assert.strictEqual(s.messageAuthor, '233222222222@s.whatsapp.net');
  assert.strictEqual(s.isCommand, false);
});

test('serializeMessage: fromMe uses bot id', () => {
  const sock = { user: { id: '233000000000:5@s.whatsapp.net' } };
  const ms = {
    key: { remoteJid: '233111111111@s.whatsapp.net', fromMe: true, id: 'GHI' },
    message: { conversation: '.stats' },
  };
  const s = serializeMessage(ms, sock);
  assert.strictEqual(s.sender, '233000000000@s.whatsapp.net');
});

test('serializeMessage: button response', () => {
  const sock = { user: { id: '233000000000:5@s.whatsapp.net' } };
  const ms = {
    key: { remoteJid: '233111111111@s.whatsapp.net', fromMe: false, id: 'JKL' },
    message: { buttonsResponseMessage: { selectedButtonId: 'btn_yes' } },
  };
  const s = serializeMessage(ms, sock);
  assert.strictEqual(s.isButtonResponse, true);
  assert.strictEqual(s.buttonId, 'btn_yes');
});

test('serializeMessage: null on garbage', () => {
  assert.strictEqual(serializeMessage(null, {}), null);
  assert.strictEqual(serializeMessage({ key: {} }, {}), null);
});

test('convertLidToJid: unknown lid returns lid', () => {
  assert.strictEqual(convertLidToJid('123@lid'), '123@lid');
});

// ---- dedupe ----
test('dedupe: same id claimed twice', () => {
  resetDedupe();
  assert.strictEqual(claimMessageId('id-1'), true);
  assert.strictEqual(claimMessageId('id-1'), false);
  assert.strictEqual(claimMessageId('id-2'), true);
});

// ---- super-users ----
test('super-users: owner numbers included', () => {
  const jids = buildSuperUsers('233000000000@s.whatsapp.net');
  assert.ok(jids.includes('233000000000@s.whatsapp.net'));
});
test('super-users: isSuperUser resolves', () => {
  // config.owner may be empty in test env — bot id must still count.
  assert.strictEqual(isSuperUser('233000000000@s.whatsapp.net', '233000000000@s.whatsapp.net'), true);
  assert.strictEqual(isSuperUser('11111111111@s.whatsapp.net', '233000000000@s.whatsapp.net'), false);
});

// ---- connection state machine ----
test('connection: backoff grows exponentially, capped at 300s', () => {
  assert.strictEqual(computeDelay(1), 5000);
  assert.strictEqual(computeDelay(2), 10000);
  assert.strictEqual(computeDelay(3), 20000);
  assert.strictEqual(computeDelay(7), 300000);
  assert.strictEqual(computeDelay(50), 300000);
});

test('connection: clean close (no error) -> none', () => {
  const d = evaluateDisconnect({ lastDisconnect: {}, attempt: 1 });
  assert.strictEqual(d.action, 'none');
  assert.strictEqual(d.code, null);
});

test('connection: loggedOut -> wipe-session', () => {
  const { Boom } = require('@hapi/boom');
  const { DisconnectReason } = require('@whiskeysockets/baileys');
  const d = evaluateDisconnect({
    lastDisconnect: { error: new Boom('Logged out', { statusCode: DisconnectReason.loggedOut }) },
    attempt: 1,
  });
  assert.strictEqual(d.action, 'wipe-session');
});

test('connection: connectionClosed -> reconnect with delay', () => {
  const { Boom } = require('@hapi/boom');
  const { DisconnectReason } = require('@whiskeysockets/baileys');
  const d = evaluateDisconnect({
    lastDisconnect: { error: new Boom('Lost', { statusCode: DisconnectReason.connectionLost }) },
    attempt: 2,
  });
  assert.strictEqual(d.action, 'reconnect');
  assert.strictEqual(d.delayMs, 10000);
});

test('connection: plain Error without statusCode is NOT badSession', () => {
  const d = evaluateDisconnect({ lastDisconnect: { error: new Error('boom') }, attempt: 1 });
  assert.notStrictEqual(d.action, 'wipe-session');
  assert.strictEqual(d.action, 'reconnect');
});

test('connection: max retries -> none', () => {
  const { Boom } = require('@hapi/boom');
  const { DisconnectReason } = require('@whiskeysockets/baileys');
  const d = evaluateDisconnect({
    lastDisconnect: { error: new Boom('Lost', { statusCode: DisconnectReason.connectionLost }) },
    attempt: 500,
  });
  assert.strictEqual(d.action, 'none');
});

test('getDisconnectCode: null error -> null', () => {
  assert.strictEqual(getDisconnectCode({}), null);
  assert.strictEqual(getDisconnectCode({ error: new Error('x') }), null);
});

// ---- logger pino-compat ----
test('logger: has trace + level property', () => {
  assert.strictEqual(typeof logger.trace, 'function');
  assert.strictEqual(typeof logger.level, 'string');
  logger.trace('trace works'); // must not throw
});

test('logger: child accepts object bindings', () => {
  const child = logger.child({ class: 'ns' });
  assert.strictEqual(typeof child.trace, 'function');
  assert.strictEqual(typeof child.info, 'function');
  child.info('child works'); // must not throw
  const child2 = child.child({ deeper: true });
  assert.strictEqual(typeof child2.error, 'function');
});

test('logger: pino-style (bindings, msg) call', () => {
  logger.info({ me: 'x', platform: 'web' }, 'pairing configured'); // must not throw
  logger.error({ node: {} }, 'stream errored out');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

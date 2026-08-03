/**
 * tests/blackhat-bridge.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Tests for the Black Hat command bridge:
 *   - registry load (native + black-hat)
 *   - collision policy
 *   - command dispatch with conText adapter
 *   - body commands ("$", ">")
 *   - owner gating
 *   - error isolation (failing black-hat command never crashes)
 * Run: node tests/blackhat-bridge.js
 * -----------------------------------------------------------------------------
 */

'use strict';

const assert = require('assert');

const registry = require('../services/whatsapp/commands');
const blackhat = require('../services/whatsapp/blackhat');
const { handleMessage } = require('../services/whatsapp/message-handler');
const { resetDedupe } = require('../services/whatsapp/message-handler');

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

/** Minimal mock socket. */
function makeSock(overrides = {}) {
  const sent = [];
  const sock = {
    sent,
    user: { id: '233000000000:5@s.whatsapp.net' },
    sendMessage: async (jid, content, opts) => {
      sent.push({ jid, content, opts });
      return { key: { id: 'sent-' + sent.length } };
    },
    groupMetadata: async (jid) => ({
      jid,
      subject: 'Test Group',
      participants: [
        { id: '233000000000@s.whatsapp.net', admin: 'admin' },
        { id: '233111111111@s.whatsapp.net' },
      ],
    }),
    onWhatsApp: async (num) => [{ jid: `${num}@s.whatsapp.net`, exists: true }],
    ...overrides,
  };
  return sock;
}

function makeSession() {
  return { number: '233000000000', sock: null, emit: () => {}, once: () => {}, touch: () => {}, levelingEnabled: false };
}

/** Build a raw Baileys-style message. */
function rawMsg(text, opts = {}) {
  return {
    key: {
      remoteJid: opts.remoteJid || '233111111111@s.whatsapp.net',
      participant: opts.participant,
      fromMe: !!opts.fromMe,
      id: opts.id || 'MSG' + Math.random().toString(36).slice(2, 10),
    },
    message: { conversation: text },
    pushName: opts.pushName || 'TestUser',
  };
}

(async () => {
  console.log('--- black-hat bridge tests ---\n');

  await registry.loadAll();
  const bhResult = await blackhat.registerAll(registry);
  const total = registry.list().length;

  test(`bridge loaded ${bhResult.loaded} commands (expect > 240)`, () => {
    assert.ok(bhResult.loaded > 240, `loaded ${bhResult.loaded}`);
    assert.strictEqual(bhResult.errors.length, 0, JSON.stringify(bhResult.errors));
  });

  test('total registry size > 250 (native 20 + black-hat)', () => {
    assert.ok(total > 250, `total ${total}`);
  });

  test('native command wins on collision ("ping")', () => {
    const ping = registry.get('ping');
    assert.ok(ping, 'ping exists');
    assert.ok(!ping.blackhat, 'ping should be the NATIVE command');
  });

  test('black-hat commands registered in categories', () => {
    assert.ok(registry.has('onwa'));
    assert.ok(registry.has('vcf'));
    assert.ok(registry.has('gemini'));
    assert.ok(registry.has('ttt'));
    assert.ok(registry.has('setbotname'));
    assert.ok(registry.has('fancy'));
  });

  // ---- dispatch: .onwa with mock onWhatsApp ----
  test('dispatch: .onwa <number> calls handler and replies', async () => {
    resetDedupe();
    const sock = makeSock();
    const session = makeSession();
    const msg = rawMsg('.onwa 255794469700', { id: 't-onwa' });
    const handled = await handleMessage(sock, msg, session);
    assert.strictEqual(handled, true, 'should be handled as a command');
    const replies = sock.sent.filter((s) => s.content?.text);
    assert.ok(replies.length > 0, 'expected a reply');
    assert.ok(replies.some((r) => r.content.text.includes('Number Found')), JSON.stringify(replies.map(r => r.content.text)));
  });

  // ---- dispatch: unknown command returns false ----
  test('dispatch: non-command message untouched', async () => {
    resetDedupe();
    const sock = makeSock();
    const handled = await handleMessage(sock, rawMsg('just chatting', { id: 't-chat' }), makeSession());
    assert.strictEqual(handled, false);
    assert.strictEqual(sock.sent.length, 0);
  });

  // ---- owner gating: setbotname for non-owner ----
  test('dispatch: owner command blocked for non-owner', async () => {
    resetDedupe();
    const sock = makeSock();
    const handled = await handleMessage(sock, rawMsg('.setbotname Hacker', { id: 't-set' }), makeSession());
    assert.strictEqual(handled, true, 'command was recognized');
    const replies = sock.sent.filter((s) => s.content?.text);
    assert.ok(replies.some((r) => /owner|🔒|Owner/i.test(r.content.text)), JSON.stringify(replies.map(r => r.content.text)));
  });

  // ---- body command: "$" shell — non-owner must NOT execute ----
  test('body command: "$" shell exec blocked for non-owner', async () => {
    resetDedupe();
    const sock = makeSock();
    const msg = rawMsg('$ echo hacked', { id: 't-shell' });
    const handled = await handleMessage(sock, msg, makeSession());
    // body commands are tried when not a prefix command
    assert.strictEqual(handled, true);
    assert.ok(!sock.sent.some((s) => s.content?.text?.includes('hacked')), 'shell must NOT run for non-owner');
  });

  // ---- error isolation: a failing command returns false without crashing ----
  test('error isolation: command throwing is caught', async () => {
    resetDedupe();
    const sock = makeSock({
      onWhatsApp: async () => { throw new Error('wa down'); },
    });
    const handled = await handleMessage(sock, rawMsg('.onwa 255794469700', { id: 't-err' }), makeSession());
    assert.strictEqual(handled, true);
    // command's own try/catch replies with ⚠️ error message
    const errReply = sock.sent.find((s) => s.content?.text?.includes('⚠️') || s.content?.text?.includes('Could not verify'));
    assert.ok(errReply, 'expected graceful error reply');
  });

  // ---- games: .ttt creates a game ----
  test('games: .ttt starts a waiting game', async () => {
    resetDedupe();
    const sock = makeSock();
    const msg = rawMsg('.ttt', { remoteJid: '123456789@g.us', participant: '233111111111@s.whatsapp.net', id: 't-ttt' });
    const handled = await handleMessage(sock, msg, makeSession());
    assert.strictEqual(handled, true);
    const reply = sock.sent.find((s) => s.content?.text?.includes('TIC TAC TOE') || s.content?.text?.includes('waiting') || s.content?.text?.includes('Game'));
    assert.ok(reply, 'expected game-start reply: ' + JSON.stringify(sock.sent.map(s => s.content.text).slice(0, 3)));
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});

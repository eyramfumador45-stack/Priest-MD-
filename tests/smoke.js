/**
 * tests/smoke.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Offline smoke test: exercises the command registry, plugin system, message
 * pipeline, middleware chain and command execution using a mock socket.
 * Run: node tests/smoke.js
 * -----------------------------------------------------------------------------
 */

'use strict';

const registry = require('../services/whatsapp/commands');
const pluginManager = require('../services/whatsapp/plugins');
const { handleMessage } = require('../services/whatsapp/message-handler');

function assert(cond, label) {
  if (!cond) {
    // eslint-disable-next-line no-console
    console.error(`✗ FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    // eslint-disable-next-line no-console
    console.log(`✓ ${label}`);
  }
}

/** Build a minimal mock socket. */
function makeSock() {
  const sent = [];
  return {
    sent,
    user: { id: '233000000000@s.whatsapp.net' },
    sendMessage: async (jid, content) => { sent.push({ jid, content }); },
    groupMetadata: async (jid) => ({ jid, subject: 'Test Group', participants: [] }),
    groupParticipantsUpdate: async () => {},
  };
}

/** Build a minimal mock session. */
function makeSession(number = '233000000000') {
  return {
    number,
    sock: makeSock(),
    emit: () => {},
    once: () => {},
    touch: () => {},
  };
}

async function run() {
  // eslint-disable-next-line no-console
  console.log('--- Priest MD smoke test ---\n');

  // 1. Command registry loads commands.
  await registry.loadAll();
  const count = registry.list().length;
  assert(count > 0, `command registry loaded ${count} commands`);
  assert(registry.has('ping'), 'command "ping" registered');
  assert(registry.has('p'), 'alias "p" resolves');
  assert(!registry.has('index'), 'index.js excluded from commands');

  // 2. Plugin system loads plugins.
  pluginManager.loadAll();
  assert(pluginManager.plugins.size >= 1, `plugins loaded (${pluginManager.plugins.size})`);
  assert(registry.has('pluginhit'), 'plugin command "pluginhit" registered');

  // 3. Message pipeline executes a command.
  const session = makeSession();
  const msg = {
    key: { remoteJid: '233111111111@s.whatsapp.net', fromMe: false },
    pushName: 'Tester',
    message: { conversation: '.ping' },
  };
  const handled = await handleMessage(session.sock, msg, session);
  assert(handled === true, 'command message was handled');
  assert(session.sock.sent.length > 0, 'command produced an outbound reply');
  // eslint-disable-next-line no-console
  console.log('   → reply:', JSON.stringify(session.sock.sent[0]?.content?.text));

  // 4. Non-command text is ignored.
  const msg2 = {
    key: { remoteJid: '233111111111@s.whatsapp.net', fromMe: false },
    message: { conversation: 'just chatting' },
  };
  const handled2 = await handleMessage(session.sock, msg2, session);
  assert(handled2 === false, 'plain text is not treated as a command');

  // 5. Unknown command is ignored (no crash).
  const msg3 = {
    key: { remoteJid: '233111111111@s.whatsapp.net', fromMe: false },
    message: { conversation: '.nonexistentcommand' },
  };
  const handled3 = await handleMessage(session.sock, msg3, session);
  assert(handled3 === false, 'unknown command handled gracefully');

  // 6. Command with args.
  const session2 = makeSession();
  const msg4 = {
    key: { remoteJid: '233111111111@s.whatsapp.net', fromMe: false },
    pushName: 'Tester',
    message: { conversation: '.roll 20' },
  };
  const handled4 = await handleMessage(session2.sock, msg4, session2);
  assert(handled4 === true, 'command with args executed');
  // eslint-disable-next-line no-console
  console.log('   → roll reply:', session2.sock.sent[0]?.content?.text);

  // 7. Owner command blocked for non-owner.
  const session3 = makeSession();
  const msg5 = {
    key: { remoteJid: '233111111111@s.whatsapp.net', fromMe: false },
    message: { conversation: '.plugins' },
  };
  await handleMessage(session3.sock, msg5, session3);
  const denied = session3.sock.sent.some((r) => /owner/i.test(r.content?.text || ''));
  assert(denied, 'owner command blocked for non-owner');

  // eslint-disable-next-line no-console
  console.log('\n--- smoke test complete ---');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Smoke test crashed:', err);
  process.exit(1);
});

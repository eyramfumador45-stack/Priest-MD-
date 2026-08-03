/**
 * tests/telegram-setup.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Verifies the Telegram control panel wires up correctly (middleware, command
 * loader, callback router, pairing text handler) without launching the bot.
 * Run: node tests/telegram-setup.js
 * -----------------------------------------------------------------------------
 */

'use strict';

const { TelegramBot } = require('../services/telegram');
const { SecurityManager } = require('../services/whatsapp/security');
const config = require('../config/config');

function assert(cond, label) {
  if (cond) console.log(`✓ ${label}`);
  else { console.error(`✗ FAIL: ${label}`); process.exitCode = 1; }
}

// Dummy deps.
const deps = {
  config: { ...config, telegram: { ...config.telegram, token: '123:TEST_TOKEN' } },
  sessionManager: { list: () => [], count: () => 0, has: () => false, stop: () => {}, create: () => {} },
  pluginManager: { plugins: new Map() },
  shutdown: () => {},
};

async function run() {
  console.log('--- Telegram control panel wiring test ---\n');

  // 1. Setup without crashing.
  const bot = new TelegramBot(deps);
  bot.setup();
  assert(!!bot.bot, 'Telegraf bot instance created');
  assert(bot.bot.command !== undefined, 'command registration available');

  // 2. Command modules are discoverable & valid.
  const cmdDir = require('../services/telegram/commands');
  const fs = require('fs');
  const path = require('path');
  const files = fs.readdirSync(cmdDir.COMMANDS_DIR).filter((f) => f.endsWith('.js') && f !== 'index.js');
  assert(files.length >= 10, `telegram command modules present (${files.length})`);
  for (const f of files) {
    const m = require(path.join(cmdDir.COMMANDS_DIR, f));
    const c = m.default || m;
    assert(typeof c.handler === 'function' && c.name, `command module ${f} valid`);
  }

  // 3. Pairing helpers exist.
  const pairing = require('../services/telegram/pairing');
  assert(typeof pairing.startPairing === 'function', 'pairing.startPairing available');
  assert(typeof pairing.handleNumber === 'function', 'pairing.handleNumber available');

  // 4. Callback router registrable.
  const cb = require('../services/telegram/callbacks');
  assert(typeof cb.registerCallbacks === 'function', 'callback router available');

  // 5. Security manager loads modules.
  const fakeSession = { sock: null, emit: () => {}, once: () => {}, touch: () => {} };
  const sm = new SecurityManager(fakeSession);
  assert(sm.modules.length >= 5, `security modules loaded (${sm.modules.length})`);
  console.log('   modules:', sm.modules.map((m) => m.name).join(', '));

  console.log('\n--- telegram-setup test complete ---');
}

run().catch((e) => { console.error('crash:', e); process.exit(1); });

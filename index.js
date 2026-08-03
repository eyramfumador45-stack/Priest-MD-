#!/usr/bin/env node
/**
 * index.js — PRIEST MD Entry Point
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Boots the framework: config, banner, database, WhatsApp sessions, the
 * Telegram control panel and the scheduler, then runs until interrupted.
 * -----------------------------------------------------------------------------
 */

'use strict';

const chalk = require('chalk');

const config = require('./config/config');
const logger = require('./shared/logger');
const database = require('./database');
const migrations = require('./database/migrations');
const sessionManager = require('./services/whatsapp/session-manager');
const pluginManager = require('./services/whatsapp/plugins');
const { TelegramBot } = require('./services/telegram');
const scheduler = require('./scheduler');

/** Render the official startup banner. */
function showBanner() {
  // eslint-disable-next-line no-console
  console.log(chalk.magenta(config.branding.banner));
  // eslint-disable-next-line no-console
  console.log(chalk.gray(`  ${config.branding.officialBranding}\n`));
}

/** Build the shared dependency bag passed to the Telegram bot. */
function buildDeps() {
  return {
    config,
    sessionManager,
    pluginManager,
    shutdown,
  };
}

let telegramBot = null;

/** Graceful shutdown sequence. */
async function shutdown(signal) {
  logger.info(`[app] shutting down (${signal || 'manual'})`);
  try {
    scheduler.stopScheduler();
    if (telegramBot) await telegramBot.stop();
    await sessionManager.stopAll();
    await database.disconnect();
  } catch (err) {
    logger.error('[app] shutdown error', { error: err.message });
  } finally {
    logger.info('[app] goodbye');
    process.exit(0);
  }
}

async function main() {
  showBanner();
  logger.info(`[app] ${config.branding.officialBranding} — starting`);

  // 1. Database.
  await database.connect();

  // 2. Migrations (best-effort).
  if (database.isConnected()) {
    await migrations.run(database.mongoose.connection, database.models);
  }

  // 3. WhatsApp commands + plugins (load once).
  if (config.features?.commands !== false) {
    const registry = require('./services/whatsapp/commands');
    await registry.loadAll();
    // Black-hat command library (compatibility bridge, config-guarded).
    if (config.features?.blackhatCommands !== false) {
      const { registerAll } = require('./services/whatsapp/blackhat');
      await registerAll(registry);
    }
  }
  if (config.features?.plugins !== false) {
    pluginManager.loadAll();
  }

  // 4. Restore persisted WhatsApp sessions.
  if (config.whatsapp?.enabled !== false) {
    await sessionManager.restoreAll();
  }

  // 5. Telegram control panel.
  if (config.telegram?.enabled !== false) {
    telegramBot = new TelegramBot(buildDeps());
    telegramBot.setup();
    await telegramBot.start();
  }

  // 6. Scheduler.
  if (config.features?.scheduler !== false) {
    scheduler.startScheduler();
  }

  logger.info(`[app] startup complete — ready. Sessions: ${sessionManager.count()}`);
}

// Process signal handlers.
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.warn('[app] unhandled rejection', { reason: reason?.message || reason });
});
process.on('uncaughtException', (err) => {
  logger.error('[app] uncaught exception', { error: err.message, stack: err.stack });
});

main().catch((err) => {
  logger.fatal('[app] fatal startup error', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = { shutdown };

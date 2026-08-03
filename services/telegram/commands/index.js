/**
 * services/telegram/commands/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Telegram command loader. Scans the commands/ directory and registers each
 * module onto the Telegraf bot. Adding a file auto-registers its /command.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const logger = require('../../../shared/logger');

const COMMANDS_DIR = __dirname;

/**
 * Register all Telegram command modules onto the bot.
 * @param {object} bot Telegraf instance
 * @param {object} deps shared dependencies (sessionManager, config, ...)
 */
function registerCommands(bot, deps) {
  const files = fs
    .readdirSync(COMMANDS_DIR)
    .filter((f) => f.endsWith('.js') && f !== 'index.js');

  for (const file of files) {
    try {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const mod = require(path.join(COMMANDS_DIR, file));
      const cmd = mod.default || mod;
      if (typeof cmd.handler !== 'function' || !cmd.name) {
        logger.warn(`[telegram:commands] invalid command ${file}`);
        continue;
      }
      const handler = (ctx) => cmd.handler(ctx, deps);
      bot.command(cmd.name, handler);
      (cmd.aliases || []).forEach((a) => bot.command(a, handler));
      logger.debug(`[telegram:commands] registered /${cmd.name}`);
    } catch (err) {
      logger.error(`[telegram:commands] failed to load ${file}`, { error: err.message });
    }
  }
}

module.exports = { registerCommands, COMMANDS_DIR };

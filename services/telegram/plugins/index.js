/**
 * services/telegram/plugins/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Telegram plugin loader. Plugins export `install(api)` where api exposes
 * `command(name, handler)` to add control-panel commands without editing core.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const logger = require('../../../shared/logger');

const PLUGINS_DIR = __dirname;

class TelegramPluginManager {
  constructor() {
    this.plugins = new Map();
  }

  /**
   * Load all Telegram plugin files.
   * @param {object} bot Telegraf
   * @param {object} deps
   */
  loadAll(bot, deps) {
    const files = fs
      .readdirSync(PLUGINS_DIR)
      .filter((f) => f.endsWith('.js') && f !== 'index.js');
    for (const file of files) {
      try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const mod = require(path.join(PLUGINS_DIR, file));
        const plugin = mod.default || mod;
        if (typeof plugin.install !== 'function') continue;
        const api = {
          command: (name, handler) => {
            if (bot) bot.command(name, (ctx) => handler(ctx, deps));
          },
          help: (text) => { /* hook for help aggregation */ },
          config: deps.config,
          logger: logger.child(`tg-plugin:${plugin.name || 'unknown'}`),
        };
        plugin.install(api);
        this.plugins.set(plugin.name || file, plugin);
        logger.info(`[telegram:plugins] loaded "${plugin.name || file}"`);
      } catch (err) {
        logger.error(`[telegram:plugins] failed ${file}`, { error: err.message });
      }
    }
  }
}

module.exports = new TelegramPluginManager();
module.exports.TelegramPluginManager = TelegramPluginManager;

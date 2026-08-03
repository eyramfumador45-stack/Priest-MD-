/**
 * services/whatsapp/plugins/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Plugin loader. Dropping a plugin into the plugins/ directory auto-loads it.
 * A plugin exports `install(api)` and may declare `commands`. Core source code
 * never needs editing to add functionality.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const logger = require('../../../shared/logger');
const registry = require('../commands');

const PLUGINS_DIR = __dirname;

class PluginManager {
  constructor() {
    this.plugins = new Map(); // name -> plugin record
  }

  /** Register a command object into the shared command registry. */
  registerCommand(cmd) {
    // The registry expects a file path; plugins provide in-memory commands.
    // We wrap them into the registry's expected shape by adding a synthetic
    // loader entry.
    const wrapped = {
      ...cmd,
      name: String(cmd.name).toLowerCase(),
      aliases: (cmd.aliases || []).map((a) => String(a).toLowerCase()),
      file: `plugin://${cmd.name}`,
    };
    registry.commands.set(wrapped.name, wrapped);
    for (const a of wrapped.aliases) registry.aliases.set(a, wrapped.name);
    logger.debug(`[plugins] registered command "${wrapped.name}"`);
    return wrapped;
  }

  /**
   * Load a single plugin file.
   * @returns {object|null} plugin record
   */
  loadFile(file) {
    const full = path.resolve(file);
    let mod;
    try {
      delete require.cache[require.resolve(full)];
      // eslint-disable-next-line global-require,import/no-dynamic-require
      mod = require(full);
      if (mod && mod.default) mod = mod.default;
    } catch (err) {
      logger.error(`[plugins] failed to load ${path.basename(full)}`, { error: err.message });
      return null;
    }

    if (typeof mod.install !== 'function') {
      logger.warn(`[plugins] ${path.basename(full)} missing install() — skipping`);
      return null;
    }

    const api = {
      registerCommand: (c) => this.registerCommand(c),
      registerCommands: (list) => (list || []).map((c) => this.registerCommand(c)),
      config: require('../../../config/config'),
      db: require('../../../database/models'),
      helpers: require('../../../shared/helpers'),
      utils: require('../../../shared/utils'),
      logger: logger.child(`plugin:${mod.name || 'unknown'}`),
    };

    try {
      const result = mod.install(api);
      const record = {
        name: mod.name || path.basename(full, '.js'),
        version: mod.version || '1.0.0',
        description: mod.description || '',
        author: mod.author || 'Inkora Systems',
        file: full,
        result: typeof result === 'object' ? result : {},
      };
      this.plugins.set(record.name, record);
      logger.info(`[plugins] loaded "${record.name}" v${record.version}`);
      return record;
    } catch (err) {
      logger.error(`[plugins] install() failed for ${path.basename(full)}`, { error: err.message });
      return null;
    }
  }

  /** Load every plugin file in the plugins/ directory. */
  loadAll() {
    const files = fs
      .readdirSync(PLUGINS_DIR)
      .filter((f) => f.endsWith('.js') && f !== 'index.js');
    let ok = 0;
    for (const file of files) {
      if (this.loadFile(path.join(PLUGINS_DIR, file))) ok++;
    }
    logger.info(`[plugins] loaded ${ok}/${files.length} plugins`);
    return ok;
  }
}

module.exports = new PluginManager();
module.exports.PluginManager = PluginManager;

/**
 * services/whatsapp/commands/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Automatic command registry. Recursively scans the commands/ tree, validates
 * each command's metadata, and registers it. Supports hot-reload. Adding a
 * file under commands/ auto-registers without touching core code.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const logger = require('../../../shared/logger');
const config = require('../../../config/config');

const COMMANDS_ROOT = __dirname;
const COMMAND_KEYS = ['name', 'description', 'aliases', 'category', 'usage', 'execute'];
const ALLOWED_KEYS = new Set([
  ...COMMAND_KEYS,
  'permissions',
  'cooldown',
  'owner',
  'admin',
  'group',
  'onlyGroup',
  'isGroup',
  'private',
  'premium',
  'disabled',
]);

class CommandRegistry {
  constructor() {
    this.commands = new Map(); // name -> command
    this.aliases = new Map();  // alias -> name
    this.categories = new Map();
    this._watchers = [];
  }

  /** Recursively collect all command files under a directory. */
  _collectFiles(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this._collectFiles(full, out);
      } else if (entry.name.endsWith('.js') && entry.name !== 'index.js') {
        out.push(full);
      }
    }
    return out;
  }

  /** Validate a raw command module object. */
  _validate(command) {
    if (!command || typeof command !== 'object') return 'module must export an object';
    if (typeof command.name !== 'string' || !command.name.trim()) return 'missing string "name"';
    if (typeof command.execute !== 'function') return `"${command.name}" missing function "execute"`;
    return null;
  }

  /**
   * Register an already-loaded command module (native shape) without reading
   * it from disk. Used by the black-hat bridge to register external commands.
   * @param {object} mod command module (same shape as a command file export)
   * @param {boolean} [notify]
   * @returns {object|null} normalized command or null on validation failure
   */
  registerExternal(mod, notify = true) {
    const err = this._validate(mod);
    if (err) {
      logger.warn(`[commands] invalid external command: ${err}`);
      return null;
    }
    const command = this._normalize(mod, mod.file || null);
    this._insert(command);
    if (notify) logger.debug(`[commands] registered "${command.name}" [${command.category}]`);
    return command;
  }

  /** Normalise a raw module into a command record. */
  _normalize(mod, file = null) {
    return {
      name: String(mod.name).toLowerCase(),
      description: mod.description || '',
      aliases: (mod.aliases || []).map((a) => String(a).toLowerCase()),
      category: mod.category || 'misc',
      usage: mod.usage || '',
      cooldown: Number(mod.cooldown) || config.cooldowns.default || 5000,
      owner: !!mod.owner,
      admin: !!mod.admin,
      group: !!mod.group,
      onlyGroup: !!mod.onlyGroup,
      private: !!mod.private,
      premium: !!mod.premium,
      permissions: mod.permissions || [],
      file,
      execute: mod.execute,
      raw: mod,
      blackhat: !!mod.blackhat,
    };
  }

  /** Insert a normalized command, removing previous registrations first. */
  _insert(command) {
    const prev = this.commands.get(command.name);
    if (prev) {
      for (const a of prev.aliases) this.aliases.delete(a);
      this.commands.delete(prev.name);
    }
    this.commands.set(command.name, command);
    for (const a of command.aliases) this.aliases.set(a, command.name);
    if (!this.categories.has(command.category)) this.categories.set(command.category, []);
    this.categories.get(command.category).push(command.name);
  }

  /** Load a single command file (delete existing entries for its name/aliases). */
  loadFile(file, notify = true) {
    const full = path.resolve(file);
    let mod;
    try {
      delete require.cache[require.resolve(full)];
      // eslint-disable-next-line global-require,import/no-dynamic-require
      mod = require(full);
      if (mod && mod.default) mod = mod.default;
    } catch (err) {
      logger.error(`[commands] failed to require ${path.basename(full)}`, { error: err.message });
      return null;
    }

    const err = this._validate(mod);
    if (err) {
      logger.warn(`[commands] invalid command ${path.basename(full)}: ${err}`);
      return null;
    }

    const command = this._normalize(mod, full);
    this._insert(command);

    if (notify) logger.debug(`[commands] registered "${command.name}" [${command.category}]`);
    return command;
  }

  /** Load all commands from the commands/ root. */
  async loadAll() {
    this.commands.clear();
    this.aliases.clear();
    this.categories.clear();
    const files = this._collectFiles(COMMANDS_ROOT);
    let ok = 0;
    for (const file of files) {
      if (this.loadFile(file, false)) ok++;
    }
    logger.info(`[commands] loaded ${ok}/${files.length} commands`);
    return ok;
  }

  /** Hot reload: reload a command by name or path. */
  reload(nameOrPath) {
    const existing = this.get(nameOrPath);
    if (existing) return this.loadFile(existing.file);
    // Maybe it's a path
    if (String(nameOrPath).endsWith('.js') && fs.existsSync(nameOrPath)) {
      return this.loadFile(nameOrPath);
    }
    return null;
  }

  /** Find a command by name or alias. */
  get(nameOrAlias) {
    const key = String(nameOrAlias || '').toLowerCase();
    const name = this.aliases.get(key) || key;
    return this.commands.get(name) || null;
  }

  /** Does a name/alias exist? */
  has(nameOrAlias) {
    return !!this.get(nameOrAlias);
  }

  list() {
    return [...this.commands.values()];
  }

  byCategory(category) {
    return (this.categories.get(category) || [])
      .map((n) => this.commands.get(n))
      .filter(Boolean);
  }

  /** Get all disabled commands (per config blacklist). */
  isDisabled(name) {
    const blacklisted = config.blacklist.commands || [];
    return blacklisted.some((c) => String(c).toLowerCase() === String(name).toLowerCase());
  }
}

module.exports = new CommandRegistry();
module.exports.CommandRegistry = CommandRegistry;
module.exports.COMMANDS_ROOT = COMMANDS_ROOT;

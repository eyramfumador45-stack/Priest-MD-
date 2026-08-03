/**
 * shared/logger/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Professional hierarchical logger. Writes to console and rotating log files,
 * and (optionally) persists audit records to MongoDB through the AuditLog model.
 *
 * Pino-compatible surface (required by Baileys):
 *   - `trace()` method (Baileys calls logger.trace() during the handshake)
 *   - `child(bindings)` accepting an OBJECT of bindings (pino style) or a
 *     STRING scope (PRIEST MD style) — children expose the full method set
 *   - `level` getter/setter (string|number) so Baileys can query/silence it
 *   - pino-style `(bindings, msg)` argument order is auto-detected alongside
 *     PRIEST MD's own `(message, meta)` order
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const config = require('../../config/config');

const LEVELS = Object.freeze({
  trace: 5,
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
  silent: Infinity,
});

const LEVEL_NAMES = Object.freeze({
  trace: 'TRACE',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  fatal: 'FATAL',
});

/** ANSI colour per level. */
const COLORS = Object.freeze({
  trace: chalk.gray,
  debug: chalk.gray,
  info: chalk.green,
  warn: chalk.yellow,
  error: chalk.red,
  fatal: chalk.bgRed.white,
});

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

/**
 * Normalise variadic call styles into { message, meta }.
 * Supported forms:
 *   (message)                          PRIEST MD / pino
 *   (message, meta)                    PRIEST MD
 *   (bindings, message)                pino (first arg object, second string)
 *   (Error)                            pino
 */
function normalizeArgs(args) {
  let [a, b] = args;

  if (a instanceof Error) {
    return { message: a.message || 'Error', meta: { stack: a.stack } };
  }

  // pino style: (bindingsObject, messageString)
  if (a && typeof a === 'object' && !Array.isArray(a)) {
    if (typeof b === 'string' || b === undefined || b === null) {
      return { message: b || '', meta: a };
    }
  }

  // PRIEST MD style: (message, meta)
  if (typeof a === 'string' || typeof a === 'number') {
    if (b && typeof b === 'object') return { message: String(a), meta: b };
    return { message: String(a), meta: {} };
  }

  // Anything else — best effort.
  return { message: a === undefined ? '' : String(a), meta: {} };
}

class Logger {
  constructor() {
    this.minLevel = LEVELS[config.logging.level] || LEVELS.info;
    this.fileEnabled = config.logging.file !== false;
    this.auditEnabled = config.logging.auditEnabled !== false;
    this._consoleEnabled = config.logging.console !== false;
    this._streams = {};
    this._ensureDir();
  }

  /** pino-compatible level property (string or number). */
  get level() {
    for (const [name, val] of Object.entries(LEVELS)) {
      if (val === this.minLevel) return name;
    }
    return 'info';
  }

  set level(value) {
    if (typeof value === 'number') {
      this.minLevel = value;
    } else if (typeof value === 'string' && value in LEVELS) {
      this.minLevel = LEVELS[value];
    }
  }

  _ensureDir() {
    if (this.fileEnabled && !fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  }

  _stream(level) {
    if (!this.fileEnabled) return null;
    if (this._streams[level]) return this._streams[level];
    const file = path.join(LOG_DIR, `${level}.log`);
    const stream = fs.createWriteStream(file, { flags: 'a' });
    this._streams[level] = stream;
    return stream;
  }

  _write(level, args) {
    const { message, meta } = normalizeArgs(args);
    if (LEVELS[level] < this.minLevel) return;

    const time = new Date().toISOString();
    const line = `[${time}] [${LEVEL_NAMES[level] || level.toUpperCase()}] ${message}`;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';

    if (this._consoleEnabled) {
      const colorFn = COLORS[level] || chalk.white;
      console.log(colorFn(line) + chalk.gray(metaStr));
    }

    const stream = this._stream(level);
    if (stream) {
      stream.write(`${line}${metaStr}\n`);
    }

    // Async audit persistence (fire-and-forget; never blocks or crashes).
    if (this.auditEnabled && (level === 'warn' || level === 'error' || level === 'fatal' || level === 'info')) {
      this._audit(level, message, meta);
    }
  }

  async _audit(level, message, meta) {
    try {
      const AuditLog = require('../../database/models/AuditLog');
      await AuditLog.create({
        level,
        message,
        meta,
        createdAt: new Date(),
      });
    } catch {
      // Non-fatal: database may be offline.
    }
  }

  trace(...args) { this._write('trace', args); }
  debug(...args) { this._write('debug', args); }
  info(...args) { this._write('info', args); }
  warn(...args) { this._write('warn', args); }
  error(...args) { this._write('error', args); }
  fatal(...args) { this._write('fatal', args); }

  /**
   * pino-compatible child logger.
   * @param {object|string} bindings pino bindings object (e.g. { module: 'x' })
   *                                 or PRIEST MD scope string
   */
  child(bindings) {
    const parent = this;
    const scope = typeof bindings === 'string' ? bindings : undefined;
    const bound = typeof bindings === 'object' && bindings !== null ? bindings : {};

    const make = (method) => (msg, meta) => {
      let merged = { ...bound };
      if (scope) merged.scope = scope;
      if (meta && typeof meta === 'object') merged = { ...merged, ...meta };
      return parent[method](msg, merged);
    };

    const child = {
      trace: make('trace'),
      debug: make('debug'),
      info: make('info'),
      warn: make('warn'),
      error: make('error'),
      fatal: make('fatal'),
      child: parent.child.bind(parent),
    };

    Object.defineProperty(child, 'level', {
      get: () => parent.level,
      set: (v) => { parent.level = v; },
    });

    return child;
  }

  close() {
    for (const s of Object.values(this._streams)) {
      try { s.end(); } catch { /* ignore */ }
    }
    this._streams = {};
  }
}

const logger = new Logger();

module.exports = logger;
module.exports.Logger = Logger;
module.exports.LEVELS = LEVELS;

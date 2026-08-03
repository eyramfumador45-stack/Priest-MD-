/**
 * shared/cache/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Lightweight in-memory TTL cache with periodic sweep. Keeps hot data in RAM
 * to minimise database queries while staying low-footprint.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../config/config');

class Cache {
  constructor(options = {}) {
    this.enabled = options.enabled !== undefined ? options.enabled : config.performance.cacheEnabled !== false;
    this.ttlMs = options.ttlMs || config.performance.cacheTtlMs || 60000;
    this._store = new Map();
    this._timers = new Map();
    this._sweep = setInterval(() => this.sweep(), this.ttlMs);
    if (this._sweep.unref) this._sweep.unref();
  }

  set(key, value, ttlMs = this.ttlMs) {
    if (!this.enabled) return;
    this._store.set(key, { value, expires: Date.now() + ttlMs });
    const existing = this._timers.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => this._store.delete(key), ttlMs);
    if (timer.unref) timer.unref();
    this._timers.set(key, timer);
  }

  get(key) {
    if (!this.enabled) return undefined;
    const entry = this._store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this._store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  /** Get a value or compute & cache it via the factory. */
  async remember(key, factory, ttlMs = this.ttlMs) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  del(key) {
    this._store.delete(key);
    const timer = this._timers.get(key);
    if (timer) clearTimeout(timer);
    this._timers.delete(key);
  }

  flush() {
    this._store.clear();
    for (const timer of this._timers.values()) clearTimeout(timer);
    this._timers.clear();
  }

  sweep() {
    const now = Date.now();
    for (const [key, entry] of this._store.entries()) {
      if (now > entry.expires) this.del(key);
    }
  }

  size() {
    return this._store.size;
  }

  close() {
    if (this._sweep) clearInterval(this._sweep);
    this.flush();
  }
}

module.exports = new Cache();
module.exports.Cache = Cache;

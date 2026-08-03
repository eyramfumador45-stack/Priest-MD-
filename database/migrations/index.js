/**
 * database/migrations/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Simple, deterministic migration runner. Migration files are plain modules
 * exporting `up(db, models)` and `down(db, models)`. Applied once each and
 * tracked in a `_migrations` collection.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const logger = require('../../shared/logger');

const MIGRATIONS_DIR = path.join(__dirname);

/**
 * Run all pending migrations in filename order.
 * @param {object} db Mongoose connection
 * @param {object} models model registry
 */
async function run(db, models) {
  if (!db || !db.collection) {
    logger.warn('[migrations] Skipped — no database connection');
    return [];
  }

  const appliedColl = db.collection('_migrations');
  const applied = new Set(
    (await appliedColl.find({}).toArray()).map((m) => m.name)
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.js') && f !== 'index.js')
    .sort();

  const executed = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    // eslint-disable-next-line global-require
    const migration = require(path.join(MIGRATIONS_DIR, file));
    try {
      if (typeof migration.up === 'function') {
        await migration.up(db, models);
        await appliedColl.insertOne({ name: file, appliedAt: new Date() });
        executed.push(file);
        logger.info(`[migrations] applied ${file}`);
      }
    } catch (err) {
      logger.error(`[migrations] failed ${file}`, { error: err.message });
    }
  }
  return executed;
}

module.exports = { run };

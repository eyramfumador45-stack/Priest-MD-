/**
 * black_hat/database/database.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Black Hat command bridge
 * Sequelize `DATABASE` stub. Black-hat DB modules in this bridge no longer use
 * Sequelize (they run on the in-memory miniModel), so this object only exists
 * for the rare `require("../black_hat/database/database").DATABASE` reference
 * (e.g. the `$` eval command). It fails with a clear message instead of
 * crashing the process.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../../../shared/logger');

function notAvailable() {
  const err = new Error(
    'Sequelize DATABASE is not available in the PRIEST MD bridge — ' +
    'black-hat database modules run on the in-memory miniModel instead.'
  );
  logger.warn('[bridge:database] Sequelize stub used', { error: err.message });
  return err;
}

const DATABASE = {
  define() { throw notAvailable(); },
  sync() { return Promise.resolve(); },
  query() { return Promise.reject(notAvailable()); },
  authenticate() { return Promise.resolve(); },
  close() { return Promise.resolve(); },
  models: {},
};

module.exports = { DATABASE };

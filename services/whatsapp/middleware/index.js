/**
 * services/whatsapp/middleware/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Middleware pipeline manager. Compose individual middleware modules into a
 * single ordered async dispatcher for each incoming command.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');

/**
 * Compose an array of middleware into a single async dispatcher.
 * Each middleware: async (ctx, next) => { ...; await next(); }
 */
function compose(middlewares) {
  return async function run(ctx) {
    let index = -1;
    async function dispatch(i) {
      if (ctx._handled) return;         // short-circuit chain
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      const fn = middlewares[i];
      if (!fn) return;
      await fn(ctx, () => dispatch(i + 1));
    }
    await dispatch(0);
  };
}

/** Build the default command pipeline in execution order. */
function defaultPipeline(deps = {}) {
  const mw = [];
  mw.push(require('./maintenance')(deps));
  mw.push(require('./blacklist')(deps));
  mw.push(require('./rate-limiter')({ windowMs: 15000, max: config.security?.antiSpam?.limit || 20 }));
  mw.push(require('./logging')(deps));
  mw.push(require('./permissions')(deps));
  mw.push(require('./cooldown')(deps));
  return compose(mw);
}

module.exports = { compose, defaultPipeline };

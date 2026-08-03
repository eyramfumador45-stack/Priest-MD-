/**
 * security/anti-fake.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Anti-fake-number: flags numbers that fail a basic validity / length check.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');
const helpers = require('../../../shared/helpers');

function enabled() {
  return config.security?.antiFakeNumber?.enabled === true;
}

/** Minimal heuristic validity check (8-15 digits after normalisation). */
function isLikelyFake(number) {
  const d = helpers.phone.digitsOnly(number);
  return d.length < 7 || d.length > 15;
}

async function onMessage(ctx, session) {
  const num = helpers.phone.jidToNumber(ctx.sender);
  if (isLikelyFake(num)) {
    const action = session.security.actionFor('antiFakeNumber');
    await session.security.act(action, ctx, ctx.sender, 'Fake/invalid phone number detected.');
    return true;
  }
  return false;
}

module.exports = { name: 'anti-fake', enabled, onMessage };

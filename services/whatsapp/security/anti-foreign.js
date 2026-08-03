/**
 * security/anti-foreign.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Anti-foreign-number: removes numbers whose country code is not in the
 * configured allow-list.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');
const helpers = require('../../../shared/helpers');

function enabled() {
  return config.security?.antiForeignNumber?.enabled === true;
}

/** Return the country code (first 1-3 digits) if known-ish, else null. */
function countryCode(number) {
  const d = helpers.phone.digitsOnly(number);
  if (d.startsWith('233')) return '233';
  if (d.startsWith('234')) return '234';
  if (d.startsWith('1')) return '1';
  if (d.startsWith('44')) return '44';
  if (d.startsWith('49')) return '49';
  if (d.startsWith('27')) return '27';
  if (d.startsWith('91')) return '91';
  if (d.startsWith('86')) return '86';
  if (d.startsWith('52')) return '52';
  if (d.startsWith('55')) return '55';
  return null;
}

async function onParticipants({ id, participants }, session) {
  const allowed = config.security?.antiForeignNumber?.allowedCountryCodes || [];
  if (!allowed.length) return;
  for (const p of participants) {
    const num = helpers.phone.jidToNumber(p);
    const cc = countryCode(num);
    if (!cc || !allowed.includes(cc)) {
      const action = config.security?.antiForeignNumber?.action || 'kick';
      const fakeCtx = { sock: session.sock, jid: id, isGroup: true };
      await session.security.act(action, fakeCtx, p, `Foreign number (${num}) not allowed.`);
    }
  }
}

module.exports = { name: 'anti-foreign', enabled, onParticipants };

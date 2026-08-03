/**
 * security/anti-abuse.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Anti-abuse: filters abusive / offensive language in groups.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'nigger', 'dickhead'];

function enabled() {
  return config.security?.antiAbuse?.enabled === true;
}

async function onMessage(ctx, session) {
  if (!ctx.isGroup) return false;
  const text = (ctx.text || '').toLowerCase();
  for (const word of BAD_WORDS) {
    if (text.split(/\s+/).some((tok) => tok === word || tok.includes(word))) {
      const action = session.security.actionFor('antiAbuse');
      await session.security.act(action, ctx, ctx.sender, 'Abusive language detected.');
      return true;
    }
  }
  return false;
}

module.exports = { name: 'anti-abuse', enabled, onMessage };

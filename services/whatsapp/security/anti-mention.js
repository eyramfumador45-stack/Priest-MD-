/**
 * security/anti-mention.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Anti-mention: flags messages that @-mention too many people at once.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');

function enabled() {
  return config.security?.antiMention?.enabled === true;
}

async function onMessage(ctx, session) {
  const limit = config.security?.antiMention?.limit || 15;
  if (!ctx.isGroup) return false;
  const text = ctx.text || '';
  const mentions = (text.match(/@/g) || []).length;
  if (mentions > limit) {
    const action = session.security.actionFor('antiMention');
    await session.security.act(action, ctx, ctx.sender, `Mass mention (${mentions} @s) detected.`);
    return true;
  }
  return false;
}

module.exports = { name: 'anti-mention', enabled, onMessage };

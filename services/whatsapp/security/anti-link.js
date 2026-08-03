/**
 * security/anti-link.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Anti-link: flags messages containing URLs / chat.whatsapp.com invites.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');
const constants = require('../../../config/constants');

const URL_RE = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[A-Za-z0-9]+|wa\.me\/[^\s]+|t\.me\/[^\s]+)/i;

function enabled() {
  return config.security?.antiLink?.enabled === true;
}

async function onMessage(ctx, session) {
  // Owner + group admins may post links.
  if (ctx.config.isOwner(ctx.sender) || ctx.config.isAdmin(ctx.sender)) return false;
  if (ctx.isGroup && ctx.command?.name && /^(\.|!)\s?(link)/i.test(ctx.text || '')) return false;

  if (URL_RE.test(ctx.text || '')) {
    const action = session.security.actionFor('antiLink');
    await session.security.act(action, ctx, ctx.sender, 'Links are not allowed here.');
    return true;
  }
  return false;
}

module.exports = { name: 'anti-link', enabled, onMessage };

/**
 * services/telegram/dashboard/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Renders the live control-panel dashboard of all WhatsApp sessions with
 * inline action buttons (reconnect / stop / remove).
 * -----------------------------------------------------------------------------
 */

'use strict';

const helpers = require('../../../shared/helpers');
const sessionManager = require('../../whatsapp/session-manager');
const config = require('../../../config/config');

const STATUS_ICON = {
  online: '🟢',
  connecting: '🟡',
  pairing: '🔵',
  pending: '⚪',
  offline: '🔴',
  error: '🟠',
  banned: '⛔',
};

/** Build the dashboard text for the current sessions. */
function renderText(sessions) {
  const lines = ['📊 *Priest MD — Session Dashboard*\n'];
  lines.push(`*${config.bot.name}* — Developed by *Inkora Systems*\n`);

  if (!sessions.length) {
    lines.push('No active sessions.\n\nUse /pair to link a new WhatsApp number.');
  } else {
    sessions.forEach((s) => {
      const icon = STATUS_ICON[s.status] || '⚪';
      const uptime = s.uptime ? ` · up ${helpers.time.duration(s.uptime)}` : '';
      lines.push(`${icon} *${s.number}* — ${s.status}${uptime}`);
    });
  }
  lines.push(`\nTotal: *${sessions.length}* session(s)`);
  return lines.join('\n');
}

/** Inline keyboard for per-session actions + refresh. */
function renderKeyboard(sessions) {
  const rows = sessions.map((s) => [
    { text: `🔄 ${s.number}`, callback_data: `wa:reconnect:${s.number}` },
  ]);
  rows.push([{ text: '🆕 Pair New', callback_data: 'wa:pair' }]);
  rows.push([{ text: '🔄 Refresh', callback_data: 'wa:refresh' }]);
  return { inline_keyboard: rows };
}

async function sendDashboard(ctx, edit = false) {
  const sessions = sessionManager.list();
  const text = renderText(sessions);
  const kb = renderKeyboard(sessions);

  if (edit) {
    await ctx.editMessageText(text, { reply_markup: kb }).catch(() => ctx.reply(text, { reply_markup: kb }));
  } else {
    await ctx.reply(text, { reply_markup: kb });
  }
}

module.exports = { renderText, renderKeyboard, sendDashboard };

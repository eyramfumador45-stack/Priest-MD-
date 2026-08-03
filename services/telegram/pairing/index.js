/**
 * services/telegram/pairing/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Telegram -> WhatsApp pairing flow. User provides a phone number, the bot
 * requests the official WhatsApp pairing code, the user enters it in
 * WhatsApp, and the session comes online automatically.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');
const helpers = require('../../../shared/helpers');
const { safe } = require('../../../shared/utils/safe');
const store = require('./store');
const sessionManager = require('../../whatsapp/session-manager');

/** Start the pairing conversation (asks for the phone number). */
async function startPairing(ctx, telegramBot) {
  const tgId = String(ctx.from.id);
  store.set(tgId, { step: 'awaiting_number' });
  await ctx.reply(
    '📱 *Pair a new WhatsApp number*\n\n' +
      'Send me the phone number you want to pair, in *international format* with country code.\n\n' +
      'Example: `233241234567` (Ghana) or `4915123456789` (Germany)\n\n' +
      'Reply /cancel to abort.'
  );
}

/** Process a phone number sent by the user during pairing. */
async function handleNumber(ctx, telegramBot) {
  const tgId = String(ctx.from.id);
  const rec = store.get(tgId);
  if (!rec || rec.step !== 'awaiting_number') return false;

  const raw = (ctx.message?.text || '').trim();
  const number = helpers.phone.normalizePhone(raw);
  if (!number || number.length < 7) {
    await ctx.reply('❌ That does not look like a valid phone number. Try again or /cancel.');
    return true;
  }

  store.set(tgId, { step: 'pairing', number });
  const msg = await ctx.reply(`🔗 Requesting pairing code for *${number}*...`);

  try {
    const svc = await sessionManager.create(number, {
      ownerTelegramId: tgId,
      name: `PriestMD-${number}`,
    });

    // Wait for the pairing code (up to 20s).
    const code = await waitForPairingCode(svc, 20000);

    // Subscribe to the connected event to confirm success.
    const onConnected = (info) => {
      ctx.reply(`✅ *Successfully paired!*\n\n*${number}* is now online on WhatsApp. 🎉`)
        .catch(() => {});
      store.clear(tgId);
    };
    svc.once('connected', onConnected);

    if (code) {
      store.set(tgId, { step: 'awaiting_code_entry', number });
      await ctx.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        undefined,
        `📲 *Pairing Code* for *+${number}*\n\n` +
          `> \`${code}\`\n\n` +
          `Open WhatsApp → *Linked Devices* → *Link a Device* → *Link with phone number instead* and enter the code above.\n\n` +
          `I will confirm once you are connected.`
      );
    } else {
      // No code but session may still connect via QR / existing credentials.
      await ctx.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        undefined,
        `🔄 Session for *+${number}* is starting. If you already have it linked, it will reconnect automatically.\n\nStatus: *${svc.status}*`
      );
    }
  } catch (err) {
    logger.error('[telegram:pairing] failed', { error: err.message });
    await ctx.reply(`❌ Pairing failed: ${err.message}`);
    store.clear(tgId);
  }
  return true;
}

/** Wait for the socket to emit a pairing code. */
function waitForPairingCode(svc, timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(svc.getStatus().pairingCode || null), timeoutMs);
    svc.once('pairing-code', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
}

/** Cancel the current pairing conversation. */
async function cancel(ctx) {
  const tgId = String(ctx.from.id);
  store.clear(tgId);
  await ctx.reply('🚫 Pairing cancelled.');
}

module.exports = { startPairing, handleNumber, cancel };

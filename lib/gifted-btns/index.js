/**
 * lib/gifted-btns/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Clean local replacement for the `gifted-btns` npm package (the original is
 * obfuscated and incompatible with @whiskeysockets/baileys 6.7.x internals).
 *
 * Implements the surface black-hat commands use:
 *   sendButtons(sock, jid, { title, text, footer, image?, buttons })
 *
 * Button shapes supported (both, even mixed in one array):
 *   { id, text }                          → classic quick-reply
 *   { name, buttonParamsJson }            → native-flow (cta_copy / cta_url …)
 *
 * Messages are modern WhatsApp interactive messages built with Baileys'
 * official helpers and sent via relayMessage.
 * -----------------------------------------------------------------------------
 */

'use strict';

const {
  generateWAMessageFromContent,
  generateWAMessageContent,
} = require('@whiskeysockets/baileys');

/** Is this button already in native-flow form? */
function isNativeFlow(btn = {}) {
  return typeof btn.name === 'string' && btn.name.length > 0;
}

/** Convert a classic {id,text} button to native-flow form. */
function toNativeFlow(btn = {}) {
  return {
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: String(btn.text ?? btn.displayText ?? btn.buttonText?.displayText ?? ''),
      id: String(btn.id ?? btn.buttonId ?? ''),
    }),
  };
}

/**
 * Send a modern interactive-message with buttons.
 * @param {object} sock Baileys socket
 * @param {string} jid target chat
 * @param {object} opts
 * @param {string} [opts.title]
 * @param {string} [opts.text]
 * @param {string} [opts.footer]
 * @param {object} [opts.image] { url } or { buffer }
 * @param {Array} [opts.buttons] classic and/or native-flow buttons
 * @param {object} [opts.quoted]
 */
async function sendButtons(sock, jid, opts = {}) {
  if (!sock || !jid) throw new Error('Invalid sendButtons arguments');
  if (!opts.buttons?.length) throw new Error('Buttons payload invalid');

  const buttons = opts.buttons.map((b) => (isNativeFlow(b) ? b : toNativeFlow(b)));

  const interactiveMessage = {
    body: { text: opts.text || '' },
    footer: opts.footer ? { text: String(opts.footer) } : undefined,
    header: opts.title ? { title: String(opts.title) } : undefined,
    nativeFlowMessage: {
      buttons,
      messageParamsJson: '',
    },
  };

  // Optional header image (best-effort — never fails the send).
  if (opts.image && (opts.image.url || opts.image.buffer)) {
    try {
      const img = await generateWAMessageContent({ image: opts.image }, {});
      if (img?.message?.imageMessage) {
        interactiveMessage.header = {
          title: opts.title ? String(opts.title) : undefined,
          hasMediaAttachment: true,
          imageMessage: img.message.imageMessage,
        };
      }
    } catch (e) { /* fall back to text-only header */ }
  }

  const message = await generateWAMessageFromContent(
    jid,
    { interactiveMessage },
    { userJid: sock.user?.id }
  );

  await sock.relayMessage(jid, message.message, {
    messageId: message.key.id,
  });
  return message;
}

/**
 * Alias with the same behaviour (some command files use this name).
 */
async function sendInteractiveMessage(sock, jid, opts = {}) {
  return sendButtons(sock, jid, opts);
}

/** Compatibility stubs (validators used by the original package). */
function validateSendButtonsPayload() { return true; }
function validateSendInteractiveMessagePayload() { return true; }
function getButtonType() { return 'interactive'; }
function getButtonArgs() { return []; }

module.exports = {
  sendButtons,
  sendInteractiveMessage,
  validateSendButtonsPayload,
  validateSendInteractiveMessagePayload,
  getButtonType,
  getButtonArgs,
};

/**
 * services/whatsapp/ctx-builder.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Builds a rich execution context passed to every middleware and command.
 *
 * Uses the shared serializer (services/whatsapp/serializer.js) so that JIDs,
 * senders and message text are canonicalised the same way across the whole
 * pipeline (LID-aware, device-suffix-stripped, lowercase).
 * -----------------------------------------------------------------------------
 */

'use strict';

const { getContentType } = require('@whiskeysockets/baileys');

const config = require('../../config/config');
const models = require('../../database/models');
const helpers = require('../../shared/helpers');
const utils = require('../../shared/utils');
const logger = require('../../shared/logger');
const constants = require('../../config/constants');
const { serializeMessage, standardizeJid } = require('./serializer');
const { registerLidFromMessage } = require('./lid-store');

/**
 * Parse a raw Baileys message into a friendly `m` object.
 */
function parseMessage(msg) {
  if (!msg?.message) return null;
  const type = getContentType(msg.message);
  const content = msg.message[type];
  return { type, content };
}

/**
 * Build the execution context for an incoming WhatsApp message.
 * @param {object} sock Baileys socket
 * @param {object} msg raw Baileys message
 * @param {object} session current session info (WhatsAppService)
 */
async function buildContext(sock, msg, session) {
  const m = parseMessage(msg);

  // Learn LID -> phone JID mappings from this message (cheap, in-memory).
  registerLidFromMessage(msg);

  // Canonical serialization (LID-aware, device-suffix stripped).
  const ser = serializeMessage(msg, sock, { PREFIX: '.' }) || {};

  const jid = ser.from || standardizeJid(msg.key?.remoteJid) || '';
  const sender =
    ser.sender ||
    standardizeJid(msg.key?.participant) ||
    standardizeJid(msg.key?.remoteJid) ||
    '';
  const isGroup = String(jid).endsWith('@g.us');
  const isBot = msg.key?.fromMe;

  const text = ser.body ?? extractText(m);

  const ctx = {
    // Core objects
    sock,
    msg,
    m,
    session,          // WhatsAppService instance
    sessionNumber: session?.number,
    db: models,
    config,
    constants,
    helpers,
    utils,
    logger: logger.child(`session:${session?.number || '?'}`),

    // Identifiers (canonical)
    jid,              // chat jid (group or private)
    sender,           // participant jid (LID-resolved when possible)
    isGroup,
    isBot,
    senderNumber: helpers.phone.jidToNumber(sender),
    chatNumber: helpers.phone.jidToNumber(jid),

    // Text
    text,
    body: text,

    // Serializer extras (useful for media/quote handling)
    serialized: ser,
    quotedMsg: ser.quotedMsg || null,
    quotedUser: ser.quotedUser || '',
    mentionedJid: ser.mentionedJid || [],
    messageAuthor: ser.messageAuthor || sender,
    isButtonResponse: ser.isButtonResponse || false,
    buttonId: ser.buttonId || null,
    pushName: ser.pushName || msg.pushName || null,

    // Command fields (filled by the dispatcher)
    prefix: '',
    commandName: '',
    args: '',
    argList: [],
    isCommand: false,
    command: null,

    // Lifecycle
    _handled: false,
    _stash: {},
  };

  // Reply & send helpers (safe no-ops if socket closed).
  ctx.reply = (content, opts) =>
    sock.sendMessage(jid, content, { quoted: msg, ...(opts || {}) });
  ctx.send = (to, content, opts) => sock.sendMessage(to, content, opts || {});
  ctx.react = (emoji) =>
    sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });

  // Group metadata (lazily fetched, cached by Baileys).
  ctx.getGroupMetadata = () => (isGroup ? sock.groupMetadata(jid) : null);

  ctx.set = (k, v) => { ctx._stash[k] = v; };
  ctx.get = (k) => ctx._stash[k];

  return ctx;
}

/** Extract plain text from a parsed message. */
function extractText(m) {
  if (!m?.content) return '';
  const c = m.content;
  if (typeof c === 'string') return c;
  if (c.conversation) return c.conversation;
  if (c.extendedTextMessage?.text) return c.extendedTextMessage.text;
  if (c.imageMessage?.caption) return c.imageMessage.caption;
  if (c.videoMessage?.caption) return c.videoMessage.caption;
  if (c.documentMessage?.caption) return c.documentMessage.caption;
  if (c.buttonsMessage?.contentText) return c.buttonsMessage.contentText;
  return '';
}

module.exports = { buildContext, extractText, parseMessage };

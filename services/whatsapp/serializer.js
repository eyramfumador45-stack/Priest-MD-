/**
 * services/whatsapp/serializer.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Message/JID serialization utilities (ported from the black-hat-md WhatsApp
 * service architecture and adapted to PRIEST MD's context builder).
 *
 * - standardizeJid(): normalises any JID form (with/without @suffix, LID,
 *   device suffix ":N") into a canonical lowercase JID
 * - convertLidToJid(): best-effort LID (@lid) -> phone JID resolution
 * - serializeMessage(): extracts a uniform, safe message object from a raw
 *   Baileys message (LID-aware sender resolution, button/list responses,
 *   captions, quoted-message metadata)
 * -----------------------------------------------------------------------------
 */

'use strict';

const { getContentType } = require('@whiskeysockets/baileys');

/**
 * Normalise any JID into a canonical lowercase JID string.
 * Handles: "2335...:12@s.whatsapp.net", bare numbers, @lid, @g.us, @broadcast.
 * @param {string|object} jid
 * @returns {string} canonical JID or '' when input is empty
 */
function standardizeJid(jid) {
  if (!jid) return '';
  try {
    let out = typeof jid === 'string' ? jid : String(jid);
    // Strip device suffix (":N").
    out = out.split(':')[0].split('/')[0];
    if (!out.includes('@')) {
      out += '@s.whatsapp.net';
    }
    return out.toLowerCase();
  } catch {
    return '';
  }
}

/** Resolve a LID (@lid) to its cached phone JID; falls back to the LID itself. */
function convertLidToJid(lid) {
  if (!lid) return '';
  if (!lid.endsWith('@lid')) return lid;
  try {
    const { getLidMapping } = require('./lid-store');
    const cached = getLidMapping(lid);
    if (cached) return cached;
  } catch { /* mapping store optional */ }
  return lid;
}

/**
 * Serialize a raw Baileys message into a uniform object.
 * Never throws — returns null for unprocessable messages.
 * @param {object} ms raw Baileys message
 * @param {object} sock Baileys socket (used for bot identity)
 * @param {object} [settings] optional { PREFIX }
 */
function serializeMessage(ms, sock, settings = {}) {
  try {
    if (!ms?.message || !ms?.key) return null;

    const botId = standardizeJid(sock?.user?.id);
    const type = getContentType(ms.message);

    // "Entry point" messages (links opened inside WhatsApp) can come from the
    // bot's own LID even when not fromMe — treat them as the bot itself.
    const hasEntryPointContext =
      ms.message?.extendedTextMessage?.contextInfo?.entryPointConversionApp === 'whatsapp' ||
      ms.message?.imageMessage?.contextInfo?.entryPointConversionApp === 'whatsapp' ||
      ms.message?.videoMessage?.contextInfo?.entryPointConversionApp === 'whatsapp' ||
      ms.message?.documentMessage?.contextInfo?.entryPointConversionApp === 'whatsapp' ||
      ms.message?.audioMessage?.contextInfo?.entryPointConversionApp === 'whatsapp';

    const isMessageYourself =
      hasEntryPointContext && ms.key.remoteJid.endsWith('@lid') && ms.key.fromMe;

    const from = isMessageYourself ? botId : standardizeJid(ms.key.remoteJid);
    const isGroup = from.endsWith('@g.us');

    // Sender resolution: prefer real phone JIDs exposed by Baileys 6.x
    // (participantPn / senderPn), fall back to participant/remoteJid.
    const rawSender = ms.key.fromMe
      ? botId
      : (ms.key.participantPn ||
         ms.key.senderPn ||
         ms.key.participantAlt ||
         ms.key.remoteJidAlt ||
         ms.key.participant ||
         ms.key.remoteJid);
    const sender = convertLidToJid(standardizeJid(rawSender)) || from;

    // --- body extraction ---
    let body = '';
    let isButtonResponse = false;
    let buttonId = null;

    if (ms.message?.interactiveResponseMessage) {
      isButtonResponse = true;
      try {
        const paramsJson =
          ms.message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson;
        buttonId = paramsJson ? (JSON.parse(paramsJson)?.id || null) : null;
      } catch { buttonId = null; }
      if (!buttonId) {
        buttonId = ms.message.interactiveResponseMessage.buttonId || null;
      }
      body = buttonId || ms.message.interactiveResponseMessage?.body?.text || '';
    } else if (ms.message?.buttonsResponseMessage?.selectedButtonId) {
      isButtonResponse = true;
      buttonId = ms.message.buttonsResponseMessage.selectedButtonId;
      body = buttonId;
    } else if (ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
      isButtonResponse = true;
      buttonId = ms.message.listResponseMessage.singleSelectReply.selectedRowId;
      body = buttonId;
    } else if (ms.message?.templateButtonReplyMessage?.selectedId) {
      isButtonResponse = true;
      buttonId = ms.message.templateButtonReplyMessage.selectedId;
      body = buttonId;
    } else if (type === 'conversation') {
      body = ms.message.conversation;
    } else if (type === 'extendedTextMessage') {
      body = ms.message.extendedTextMessage.text;
    } else if (type === 'imageMessage' && ms.message.imageMessage.caption) {
      body = ms.message.imageMessage.caption;
    } else if (type === 'videoMessage' && ms.message.videoMessage.caption) {
      body = ms.message.videoMessage.caption;
    } else if (type === 'documentMessage' && ms.message.documentMessage.caption) {
      body = ms.message.documentMessage.caption;
    }

    const prefix = settings.PREFIX || '.';
    const isCommand = typeof body === 'string' && body.startsWith(prefix);
    const command = isCommand
      ? body.slice(prefix.length).trim().split(/\s+/).shift().toLowerCase()
      : '';
    const args =
      typeof body === 'string' ? body.trim().split(/\s+/).slice(1) : [];

    // --- quote / context metadata ---
    const contextInfo =
      ms.message?.extendedTextMessage?.contextInfo ||
      ms.message?.imageMessage?.contextInfo ||
      ms.message?.videoMessage?.contextInfo ||
      ms.message?.audioMessage?.contextInfo ||
      ms.message?.documentMessage?.contextInfo ||
      ms.message?.stickerMessage?.contextInfo ||
      null;

    const quotedMsg = contextInfo?.quotedMessage || null;
    const rawQuotedUser = contextInfo?.participant || contextInfo?.remoteJid;
    const quotedUser = convertLidToJid(standardizeJid(rawQuotedUser));
    const repliedMessageAuthor = convertLidToJid(
      standardizeJid(contextInfo?.participant)
    );

    const mentionedJid = (contextInfo?.mentionedJid || []).map(standardizeJid);

    let messageAuthor = isGroup
      ? standardizeJid(ms.key.participant || ms.participant || from)
      : from;
    if (ms.key.fromMe) messageAuthor = botId;

    return {
      ms,
      mek: ms,
      type,
      from,
      isGroup,
      sender,
      botId,
      body,
      isCommand,
      command,
      args,
      q: args.join(' '),
      pushName: ms.pushName || (ms.key.fromMe ? sock?.user?.name : null) || null,
      quotedMsg,
      quotedUser,
      repliedMessageAuthor,
      mentionedJid,
      messageAuthor,
      prefix,
      isButtonResponse,
      buttonId,
      isMessageYourself,
    };
  } catch {
    return null;
  }
}

module.exports = { standardizeJid, convertLidToJid, serializeMessage };

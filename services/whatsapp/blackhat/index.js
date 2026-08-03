/**
 * services/whatsapp/blackhat/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Black Hat command bridge
 * Loads the black-hat-md command library (~250 commands) into PRIEST MD's
 * native command registry without modifying a single black-hat command file.
 *
 *   registerAll(registry)   — require command files, convert gmd() entries
 *                             into PRIEST MD commands (collision-safe)
 *   tryBodyCommands(ctx)    — body-style commands ("$" shell, ">" eval)
 *   attachGameListener(sock) — games (ttt / dice / word chain) message hook
 *
 * Every black-hat command runs inside try/catch: a failing black-hat command
 * can never take down PRIEST MD.
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const config = require('../../../config/config');
const logger = require('../../../shared/logger');
const { buildSuperUsers } = require('../super-users');
const { standardizeJid } = require('../serializer');
const { getLidMapping } = require('../lid-store');

const COMMANDS_DIR = path.join(__dirname, 'commands');
const barrel = require('./black_hat');
const { commands: bhCommands } = require('./black_hat/gmdCmds');
const {
  getGroupMetadata,
  groupCache,
  cachedGroupMetadata,
} = require('./black_hat/connection/groupCache');
const { handleGameMessage, renderBoard, getPlayerName } = require('./black_hat/gameHandler');

let registered = false;
const loadErrors = [];

/* -------------------------------------------------------------------------- */
/* Registration                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Register all black-hat commands into the PRIEST MD command registry.
 * Native PRIEST MD commands win on name/alias collisions (skipped + logged).
 * @param {object} registry PRIEST MD CommandRegistry instance
 * @returns {Promise<{loaded:number, skipped:number, errors:Array}>}
 */
async function registerAll(registry) {
  if (registered) return { loaded: 0, skipped: 0, errors: loadErrors };
  registered = true;

  // Seed the settings store (defaults from PRIEST MD config).
  await barrel.initializeSettings().catch((e) =>
    logger.warn('[blackhat] settings init error', { error: e.message })
  );

  // Load every command file — each self-registers via gmd().
  const files = fs.existsSync(COMMANDS_DIR)
    ? fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.js'))
    : [];
  for (const file of files) {
    try {
      require(path.join(COMMANDS_DIR, file));
    } catch (e) {
      loadErrors.push({ file, error: e.message });
      logger.error(`[blackhat] failed to load ${file}`, { error: e.message });
    }
  }

  let loaded = 0;
  let skipped = 0;
  for (const cmd of bhCommands) {
    const name = String(cmd.pattern || '').trim().toLowerCase();
    if (!name) continue;
    const aliases = [...(cmd.aliases || cmd.alias || [])]
      .map((a) => String(a).toLowerCase())
      .filter(Boolean);

    // Collision policy: native PRIEST MD commands win.
    if (registry.has(name) || aliases.some((a) => registry.has(a))) {
      skipped++;
      logger.debug(`[blackhat] skipped "${name}" — collides with native command`);
      continue;
    }

    const prefix = (config.bot?.prefixes && config.bot.prefixes[0]) || '.';
    const native = {
      name,
      aliases,
      category: cmd.category || 'general',
      description: cmd.description || cmd.desc || '',
      usage: `${prefix}${name}`,
      cooldown: 0,
      owner: cmd.category === 'owner' || !!cmd.owner,
      admin: !!cmd.admin,
      group: !!cmd.isGroup,
      onlyGroup: !!cmd.isGroup,
      premium: !!cmd.premium,
      blackhat: true,
      _bh: cmd,
      execute: async (ctx) => runBlackhatCommand(cmd, ctx),
    };
    registry.registerExternal(native);
    loaded++;
  }

  logger.info(
    `[blackhat] loaded ${loaded} black-hat commands (${skipped} skipped — native collisions, ${loadErrors.length} load errors)`
  );
  return { loaded, skipped, errors: loadErrors };
}

/* -------------------------------------------------------------------------- */
/* Command execution (conText adapter)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Build the black-hat `conText` object from a PRIEST MD context and run the
 * original handler: fn(from, Gifted, conText).
 */
async function runBlackhatCommand(cmd, ctx) {
  const sock = ctx.sock;
  const settings = await barrel.getAllSettings().catch(() => ({}));
  const botId = standardizeJid(sock?.user?.id);
  const superUsers = buildSuperUsers(botId);
  const senderJid = standardizeJid(ctx.sender);
  const isSuper = superUsers.includes(senderJid);

  // Group context (only when needed — cached by groupCache adapter).
  let groupInfo = null;
  let groupName = '';
  let groupAdmins = [];
  let participants = [];
  let isAdmin = false;
  let isBotAdmin = false;
  let isSuperAdmin = false;
  if (ctx.isGroup) {
    groupInfo = await getGroupMetadata(sock, ctx.jid).catch(() => null);
    const list = groupInfo?.participants || [];
    participants = list.map((p) => p.id);
    groupAdmins = list.filter((p) => p.admin).map((p) => p.id);
    groupName = groupInfo?.subject || '';
    isBotAdmin =
      groupAdmins.includes(botId) ||
      participants.some((p) => standardizeJid(p) === botId);
    isAdmin = groupAdmins.some((p) => standardizeJid(p) === senderJid);
    isSuperAdmin = list.some(
      (p) => p.admin === 'superadmin' && standardizeJid(p.id) === senderJid
    );
  }

  const helpers = {
    reply: (text, opts = {}) => {
      const content = typeof text === 'string' ? { text, ...opts } : text;
      return sock.sendMessage(ctx.jid, content, { quoted: ctx.msg });
    },
    react: (emoji) =>
      sock.sendMessage(ctx.jid, { react: { text: emoji, key: ctx.msg.key } }),
    edit: async (text, message) =>
      sock.sendMessage(ctx.jid, { text, edit: message?.key }, { quoted: ctx.msg }),
    del: async (message) =>
      sock.sendMessage(ctx.jid, { delete: message?.key }, { quoted: ctx.msg }),
  };

  const ser = ctx.serialized || {};
  const quotedMsg = ser.quotedMsg || null;

  const conText = {
    // Raw message + identity
    m: ctx.msg,
    mek: ctx.msg,
    from: ctx.jid,
    sender: senderJid,
    body: ctx.text,
    pushName: ctx.pushName || ctx.msg?.pushName || '',
    isGroup: ctx.isGroup,

    // Command fields
    args: ctx.argList || [],
    arg: ctx.argList || [],
    q: (ctx.argList || []).join(' '),
    quoted: quotedMsg,
    isCmd: true,
    command: ctx.commandName || '',
    isSuperUser: isSuper,
    superUser: superUsers,

    // Group data
    groupInfo,
    groupName,
    groupAdmins,
    participants,
    isAdmin,
    isBotAdmin,
    isSuperAdmin,
    groupMember: ctx.isGroup ? ctx.messageAuthor || '' : '',

    // Quoted / mentioned / author
    quotedMsg,
    quotedKey: ser.quotedKey || null,
    quotedUser: ser.quotedUser || '',
    repliedMessage:
      ctx.msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage || null,
    mentionedJid: ser.mentionedJid || ctx.mentionedJid || [],
    tagged: ctx.msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
    authorMessage: ctx.messageAuthor || senderJid,
    user: ser.user || '',

    // Reply / reaction / edit / delete helpers
    reply: helpers.reply,
    react: helpers.react,
    edit: helpers.edit,
    del: helpers.del,

    // Settings (PRIEST MD-branded defaults + persisted overrides)
    botMode: settings.MODE,
    botPic: settings.BOT_PIC,
    botFooter: settings.FOOTER,
    botCaption: settings.CAPTION,
    botVersion: settings.VERSION,
    ownerNumber: settings.OWNER_NUMBER,
    ownerName: settings.OWNER_NAME,
    botName: settings.BOT_NAME,
    giftedRepo: settings.BOT_REPO,
    packName: settings.PACK_NAME,
    packAuthor: settings.PACK_AUTHOR,
    newsletterUrl: settings.NEWSLETTER_URL,
    newsletterJid: settings.NEWSLETTER_JID,
    botPrefix: settings.PREFIX,
    timeZone: settings.TIME_ZONE,

    // Store functions
    getSetting: barrel.getSetting,
    setSetting: barrel.setSetting,
    getAllSettings: barrel.getAllSettings,
    resetSetting: barrel.resetSetting,
    resetAllSettings: barrel.resetAllSettings,
    getGroupSetting: barrel.getGroupSetting,
    setGroupSetting: barrel.setGroupSetting,
    getAllGroupSettings: barrel.getAllGroupSettings,
    resetGroupSetting: barrel.resetGroupSetting,
    getEnabledGroupSettings: barrel.getEnabledGroupSettings,
    getSudoNumbers: barrel.getSudoNumbers,
    setSudo: barrel.setSudo,
    delSudo: barrel.delSudo,
    clearAllSudo: barrel.clearAllSudo,
    setCommitHash: barrel.setCommitHash,
    getCommitHash: barrel.getCommitHash,

    // Group cache + LID
    getGroupMetadata: (jid) => getGroupMetadata(sock, jid || ctx.jid),
    groupCache,
    cachedGroupMetadata,
    getLidMapping,

    // Gifted API
    GiftedTechApi: barrel.GiftedTechApi,
    GiftedApiKey: barrel.GiftedApiKey,

    // Utilities
    monospace: barrel.monospace,
    gmdBuffer: barrel.gmdBuffer,
    gmdJson: barrel.gmdJson,
    gmdFancy: barrel.gmdFancy,
    gmdRandom: barrel.gmdRandom,
    gmdSticker: barrel.gmdSticker,
    formatBytes: barrel.formatBytes,
    formatAudio: barrel.formatAudio,
    formatVideo: barrel.formatVideo,
    toAudio: barrel.toAudio,
    toVideo: barrel.toVideo,
    toPtt: barrel.toPtt,
    stickerToImage: barrel.stickerToImage,
    webp2mp4File: barrel.webp2mp4File,
    isUrl: barrel.isUrl,
    isNumber: barrel.isNumber,
    runtime: barrel.runtime,
    sleep: barrel.sleep,
    getFileSize: barrel.getFileSize,
    getMimeCategory: barrel.getMimeCategory,
    getMimeFromUrl: barrel.getMimeFromUrl,
    getExtensionFromMime: barrel.getExtensionFromMime,
    isTextContent: barrel.isTextContent,
    MAX_MEDIA_SIZE: barrel.MAX_MEDIA_SIZE,
    gitRepoRegex: barrel.gitRepoRegex,
    copyFolderSync: barrel.copyFolderSync,
    dBinary: barrel.dBinary,
    eBinary: barrel.eBinary,
    dBase: barrel.dBase,
    eBase: barrel.eBase,
    getMediaBuffer: barrel.getMediaBuffer,
    getFileContentType: barrel.getFileContentType,
    bufferToStream: barrel.bufferToStream,
    uploadToPixhost: barrel.uploadToPixhost,
    uploadToImgBB: barrel.uploadToImgBB,
    uploadToCatbox: barrel.uploadToCatbox,
    uploadToGithubCdn: barrel.uploadToGithubCdn,
    uploadToGiftedCdn: barrel.uploadToGiftedCdn,
    latestWaVersion: barrel.latestWaVersion,
    runFFmpeg: barrel.runFFmpeg,
    getVideoDuration: barrel.getVideoDuration,
    createContext: barrel.createContext,
    createContext2: barrel.createContext2,
    emojis: barrel.emojis,
    logger: barrel.logger,
    config,
    standardizeJid: barrel.standardizeJid,
    convertLidToJid: barrel.convertLidToJid,
    serializeMessage: barrel.serializeMessage,
    renderBoard,
    getPlayerName,
    botId,
  };

  try {
    await cmd.function(ctx.jid, sock, conText);
    return true;
  } catch (e) {
    logger.error(`[blackhat] command "${cmd.pattern}" error`, {
      error: e.message,
      stack: e.stack,
    });
    try {
      await helpers.react('⚠️').catch(() => {});
      await helpers
        .reply(`⚠️ *${cmd.pattern}* encountered an error:\n\n${e.message}`)
        .catch(() => {});
    } catch (err) { /* ignore */ }
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Body commands ("$" shell exec, ">" JS eval — owner-gated internally)       */
/* -------------------------------------------------------------------------- */

async function tryBodyCommands(ctx) {
  if (ctx.isCommand || !ctx.text) return false;
  const body = ctx.text;
  for (const cmd of bhCommands) {
    if (cmd.on !== 'body') continue;
    const pattern = String(cmd.pattern || '');
    if (pattern && body.startsWith(pattern)) {
      await runBlackhatCommand(cmd, ctx);
      return true;
    }
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/* Games listener (ttt / dice / word-chain)                                   */
/* -------------------------------------------------------------------------- */

function attachGameListener(sock) {
  if (!sock?.ev) return;
  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const ms of messages || []) {
      Promise.resolve(handleGameMessage(sock, ms)).catch((e) =>
        logger.debug('[blackhat] game handler error', { error: e.message })
      );
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Socket compatibility polyfills                                             */
/* -------------------------------------------------------------------------- */

/**
 * Patch a Baileys socket with methods the black-hat commands expect but that
 * do not exist on @whiskeysockets/baileys 6.7.x (they were custom additions
 * of the gifted-baileys fork):
 *
 *   sock.downloadAndSaveMediaMessage(message, filename[, attachExtension])
 *     → downloads a quoted media message to a local temp file and returns
 *       the file path (used by ~10 commands: sticker/audio/video converters,
 *       profile-picture setters).
 */
function patchSocketCompat(sock) {
  if (!sock || typeof sock.downloadAndSaveMediaMessage === 'function') return sock;

  const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
  const fileType = require('file-type');

  sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    const quoted = message?.msg ? message.msg : message;
    const mime = (message?.msg || message)?.mimetype || '';
    const mtype = message?.mtype ? String(message.mtype).replace(/Message/gi, '') : mime.split('/')[0];
    const messageType = mtype || 'document';

    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    let fileTypeResult;
    try {
      fileTypeResult = await fileType.fileTypeFromBuffer(buffer);
    } catch (e) { /* ignore */ }

    const extension =
      fileTypeResult?.ext ||
      mime.split('/')[1] ||
      (messageType === 'image'
        ? 'jpg'
        : messageType === 'video'
          ? 'mp4'
          : messageType === 'audio'
            ? 'mp3'
            : 'bin');

    const trueFileName = attachExtension ? `${filename}.${extension}` : filename;
    await require('fs').promises.writeFile(trueFileName, buffer);
    return trueFileName;
  };

  return sock;
}

module.exports = {
  registerAll,
  tryBodyCommands,
  attachGameListener,
  patchSocketCompat,
  runBlackhatCommand,
  get bhCommands() {
    return bhCommands;
  },
};

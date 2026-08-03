/**
 * black_hat/gmdHelpers.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Black Hat command bridge
 * createContext / createContext2 — forwarded-message context builders used by
 * many black-hat commands. Adapted: settings come from the bridge settings
 * store (PRIEST MD defaults), branding is PRIEST MD's.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { getSetting } = require('./database/settings');

const createContext = async (userJid, options = {}) => {
  const botName = (await getSetting("BOT_NAME")) || "Priest MD";
  const botPic = (await getSetting("BOT_PIC")) || "";
  const newsletterJid = (await getSetting("NEWSLETTER_JID")) || "";
  const newsletterUrl = (await getSetting("NEWSLETTER_URL")) || "";
  const footer = (await getSetting("FOOTER")) || "ᴘᴏᴡᴇʀᴇᴅ ʙʏ Inkora Systems";

  return {
    contextInfo: {
      mentionedJid: [userJid].filter(Boolean),
      forwardingScore: 1,
      isForwarded: true,
      businessMessageForwardInfo: newsletterJid
        ? { businessOwnerJid: newsletterJid }
        : undefined,
      forwardedNewsletterMessageInfo: newsletterJid
        ? {
            newsletterJid,
            newsletterName: botName,
            serverMessageId: Math.floor(100000 + Math.random() * 900000),
          }
        : undefined,
      externalAdReply: {
        title: options.title || botName,
        body: options.body || footer,
        thumbnailUrl: botPic || undefined,
        mediaType: 1,
        mediaUrl: options.mediaUrl || botPic || undefined,
        sourceUrl: options.sourceUrl || newsletterUrl || undefined,
        showAdAttribution: true,
        renderLargerThumbnail: false,
      },
    },
  };
};

const createContext2 = async (userJid, options = {}) => {
  const botName = (await getSetting("BOT_NAME")) || "Priest MD";
  const botPic = (await getSetting("BOT_PIC")) || "";
  const newsletterJid = (await getSetting("NEWSLETTER_JID")) || "";
  const footer = (await getSetting("FOOTER")) || "ᴘᴏᴡᴇʀᴇᴅ ʙʏ Inkora Systems";

  return {
    contextInfo: {
      mentionedJid: [userJid].filter(Boolean),
      forwardingScore: 1,
      isForwarded: true,
      forwardedNewsletterMessageInfo: newsletterJid
        ? {
            newsletterJid,
            newsletterName: botName,
            serverMessageId: Math.floor(100000 + Math.random() * 900000),
          }
        : undefined,
      externalAdReply: {
        title: options.title || botName,
        body: options.body || footer,
        thumbnailUrl: botPic || undefined,
        mediaType: 1,
        showAdAttribution: true,
        renderLargerThumbnail: true,
      },
    },
  };
};

module.exports = { createContext, createContext2 };

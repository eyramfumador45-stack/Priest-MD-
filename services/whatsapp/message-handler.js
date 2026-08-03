/**
 * services/whatsapp/message-handler.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Incoming-message pipeline: build context, detect & parse commands, run the
 * middleware chain, and dispatch to the matching command. Never throws.
 * -----------------------------------------------------------------------------
 */

'use strict';

const registry = require('./commands');
const { buildContext } = require('./ctx-builder');
const { defaultPipeline } = require('./middleware');
const utils = require('../../shared/utils');
const logger = require('../../shared/logger');

/**
 * Deduplication window for processed messages (ported from black-hat-md).
 * Baileys can re-deliver the same message after a reconnect or on `append`
 * upserts; tracking IDs for 60s prevents commands double-firing.
 */
const DEDUPE_WINDOW_MS = 60000;
const processedMessages = new Set();

/** Register a message ID; returns false when it was already seen. */
function claimMessageId(messageId) {
  if (!messageId) return true; // no id -> never dedupe
  if (processedMessages.has(messageId)) return false;
  processedMessages.add(messageId);
  setTimeout(() => processedMessages.delete(messageId), DEDUPE_WINDOW_MS);
  // Guard against unbounded growth under heavy load.
  if (processedMessages.size > 10000) processedMessages.clear();
  return true;
}

/** Reset the dedupe window (exported for tests / session restarts). */
function resetDedupe() {
  processedMessages.clear();
}

/**
 * Detect the configured prefix used at the start of a message.
 */
function detectPrefix(text, prefixes) {
  for (const p of prefixes || ['.']) {
    if (typeof p === 'string' && text.startsWith(p)) return p;
  }
  return null;
}

/**
 * Handle a single incoming WhatsApp message.
 * @returns {Promise<boolean>} true if the message was handled as a command
 */
async function handleMessage(sock, msg, session) {
  try {
    if (!msg?.message || msg.key?.fromMe) return false;

    // Skip messages already processed (reconnects / duplicate upserts).
    if (!claimMessageId(msg.key?.id)) return false;

    const ctx = await buildContext(sock, msg, session);
    if (!ctx.text) return false;

    // Determine command.
    const prefixes = ctx.config.bot?.prefixes || ['.'];
    const prefix = detectPrefix(ctx.text, prefixes);
    if (!prefix) return false;

    const withoutPrefix = ctx.text.slice(prefix.length).trim();
    if (!withoutPrefix) return false;

    const argList = utils.parseArgs(withoutPrefix);
    const rawName = argList.shift() || '';
    const commandName = rawName.toLowerCase();

    const command = registry.get(commandName);
    if (!command || registry.isDisabled(commandName)) {
      // Black-hat body commands ("$" shell / ">" eval) — owner-gated inside.
      try {
        const { tryBodyCommands } = require('./blackhat');
        const handled = await tryBodyCommands(ctx);
        if (handled) return true;
      } catch (e) {
        logger.debug('[message-handler] body-command hook error', { error: e.message });
      }
      return false;
    }

    // Fill command context.
    ctx.isCommand = true;
    ctx.prefix = prefix;
    ctx.commandName = command.name;
    ctx.command = command;
    ctx.args = argList.join(' ');
    ctx.argList = argList;

    // Run middleware pipeline.
    const pipeline = defaultPipeline({ session });
    await pipeline(ctx);

    // If no middleware short-circuited, execute the command.
    if (!ctx._handled) {
      try {
        await command.execute(ctx);
      } catch (err) {
        logger.error(`[message-handler] command "${command.name}" error`, {
          error: err.message,
          stack: err.stack,
        });
        await ctx.reply({
          text: `⚠️ An error occurred while running *${command.name}*. Please try again.`,
        }).catch(() => {});
      }
    }

    return ctx.isCommand;
  } catch (err) {
    logger.error('[message-handler] uncaught error', { error: err.message, stack: err.stack });
    return false;
  }
}

module.exports = { handleMessage, claimMessageId, resetDedupe };

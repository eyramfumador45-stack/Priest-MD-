/**
 * services/telegram/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * TelegramBot: the control panel for managing WhatsApp sessions remotely.
 * Handles admin auth, command registration, pairing conversation and inline
 * callbacks. Telegram is NOT the primary bot — it manages WhatsApp.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { Telegraf } = require('telegraf');

const logger = require('../../shared/logger');
const { adminAuth, rateLimit } = require('./middleware/auth');
const { registerCommands } = require('./commands');
const { registerCallbacks } = require('./callbacks');
const pairing = require('./pairing');
const { safe } = require('../../shared/utils/safe');

class TelegramBot {
  /**
   * @param {object} deps
   * @param {object} deps.config
   * @param {object} deps.sessionManager
   * @param {object} deps.pluginManager
   * @param {Function} deps.shutdown
   */
  constructor(deps) {
    this.deps = {
      config: deps.config,
      sessionManager: deps.sessionManager,
      pluginManager: deps.pluginManager,
      telegramBot: this,
      shutdown: deps.shutdown,
    };
    this.token = deps.config.telegram.token;
    this.bot = null;
    this.started = false;
    this.log = logger.child('telegram');
  }

  /** Configure and register everything. */
  setup() {
    if (!this.token) {
      this.log.warn('No Telegram token configured — control panel disabled');
      return this;
    }

    this.bot = new Telegraf(this.token);

    // Global admin gate + rate limiter for the control panel.
    this.bot.use(adminAuth({ config: this.deps.config }));
    this.bot.use(rateLimit({ windowMs: 2000 }));

    registerCommands(this.bot, this.deps);
    registerCallbacks(this.bot, this.deps);

    // Handle the pairing conversation (phone number input).
    this.bot.on('text', (ctx) => {
      pairing.handleNumber(ctx, this).catch((err) =>
        this.log.error('pairing text handler error', { error: err.message })
      );
    });

    return this;
  }

  /** Launch the bot (long polling). */
  async start() {
    if (!this.bot) return;
    try {
      await this.bot.launch({ dropPendingUpdates: true });
      this.started = true;
      this.log.info('Telegram control panel online');
      await safe(() => this.bot.telegram.getMe().then((me) => {
        this.log.info(`Logged in as @${me.username}`);
      }), null, 'tg-getMe');
    } catch (err) {
      this.log.error('Telegram failed to start', { error: err.message });
    }
  }

  /** Graceful stop. */
  async stop() {
    if (this.bot) {
      try { this.bot.stop('SIGINT'); } catch (e) { /* ignore */ }
      this.started = false;
      this.log.info('Telegram control panel stopped');
    }
  }
}

module.exports = { TelegramBot };

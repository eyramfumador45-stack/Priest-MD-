/**
 * services/telegram/callbacks/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Inline callback router. Routes `callback_data` strings like `wa:reconnect:233X`
 * or `menu:about` to their handlers. Keeps every callback concern modular.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../shared/logger');
const helpers = require('../../../shared/helpers');
const dashboard = require('../dashboard');
const pairing = require('../pairing');

/**
 * Register the callback router on the bot.
 * @param {object} bot Telegraf
 * @param {object} deps
 */
function registerCallbacks(bot, deps) {
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery?.data || '';
    const [prefix, action, ...rest] = data.split(':');

    try {
      switch (prefix) {
        case 'wa': {
          if (action === 'reconnect') {
            const number = rest[0];
            if (deps.sessionManager.has(number)) {
              await ctx.answerCbQuery('Restarting session...');
              await deps.sessionManager.stop(number);
              await deps.sessionManager.create(number);
              await dashboard.sendDashboard(ctx, true);
            } else {
              await ctx.answerCbQuery('No such session.');
            }
          } else if (action === 'pair') {
            await ctx.answerCbQuery('Starting pairing...');
            await pairing.startPairing(ctx, deps.telegramBot);
          } else if (action === 'refresh') {
            await ctx.answerCbQuery('Refreshing...');
            await dashboard.sendDashboard(ctx, true);
          }
          break;
        }
        case 'menu': {
          await ctx.answerCbQuery();
          if (action === 'dashboard') await dashboard.sendDashboard(ctx, false);
          else if (action === 'pair') await pairing.startPairing(ctx, deps.telegramBot);
          else if (action === 'sessions') await dashboard.sendDashboard(ctx, false);
          else if (action === 'status') {
            await ctx.telegram.sendMessage(ctx.chat.id, 'Check /status for system health.');
          } else if (action === 'plugins') {
            await ctx.telegram.sendMessage(ctx.chat.id, 'Check /plugins for loaded plugins.');
          } else if (action === 'logs') {
            await ctx.telegram.sendMessage(ctx.chat.id, 'Check /logs for recent logs.');
          } else if (action === 'about') {
            await ctx.telegram.sendMessage(ctx.chat.id, 'Check /about for framework info.');
          }
          break;
        }
        default:
          await ctx.answerCbQuery('Unknown action.');
      }
    } catch (err) {
      logger.error('[telegram:callback] error', { error: err.message, data });
      await ctx.answerCbQuery('Error occurred.').catch(() => {});
    }
  });
}

module.exports = { registerCallbacks };

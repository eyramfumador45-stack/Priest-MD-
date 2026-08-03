/**
 * config/constants.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Application-wide constants that never change at runtime.
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = Object.freeze({
  /** Application identifiers */
  APP: {
    NAME: 'Priest MD',
    DEVELOPER: 'Inkora Systems',
    VERSION: '1.0.0',
    DESCRIPTION: 'Multi-Device WhatsApp Bot Framework with Telegram Control Panel',
    PLATFORM: 'WhatsApp Multi-Device',
  },

  /** Core path fragments */
  PATHS: {
    SESSIONS: 'sessions',
    ASSETS: 'assets',
    LOGS: 'logs',
    COMMANDS: 'commands',
    PLUGINS: 'plugins',
    EVENTS: 'events',
    MIDDLEWARE: 'middleware',
    SECURITY: 'security',
    MIGRATIONS: 'database/migrations',
    MODELS: 'database/models',
    TELEGRAM: 'telegram',
    WHATSAPP: 'whatsapp',
  },

  /** Default values (overridable by config/configuration.json) */
  DEFAULTS: {
    PREFIX: '.',
    GROUP_PREFIX: '.',
    TIMEZONE: 'UTC',
    LOCALE: 'en',
  },

  /** WhatsApp media / message kinds handled by the engine */
  MESSAGE_TYPES: [
    'conversation',
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage',
    'stickerMessage',
    'locationMessage',
    'contactMessage',
    'contactsArrayMessage',
    'extendedTextMessage',
    'buttonsMessage',
    'listMessage',
    'templateMessage',
    'pollCreationMessage',
    'reactionMessage',
  ],

  /** Permission levels (ascending privilege) */
  PERMISSION_LEVELS: Object.freeze({
    USER: 1,
    GROUP_ADMIN: 2,
    MODERATOR: 3,
    PREMIUM: 4,
    ADMIN: 5,
    OWNER: 6,
  }),

  /** Cooldown constants (milliseconds) */
  COOLDOWNS: Object.freeze({
    DEFAULT: 5000,
    MIN: 1000,
    MAX: 3600000,
  }),

  /** Message length limits */
  LIMITS: Object.freeze({
    MAX_MESSAGE_LENGTH: 4096,
    MAX_COMMAND_ARGS: 50,
    MAX_SESSION_NAME: 32,
  }),

  /** Security */
  SECURITY: Object.freeze({
    MAX_JOINS_WINDOW: 60000,       // ms
    MAX_JOINS_BEFORE_ANTIRAID: 10, // joins within window
    DEFAULT_FLOOD_LIMIT: 5,        // messages within window
    FLOOD_WINDOW: 10000,           // ms
    CAPTCHA_LENGTH: 5,
    CAPTCHA_EXPIRY: 300000,        // ms
  }),
});

/**
 * black_hat/index.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Black Hat command bridge barrel
 * Mirrors the export surface of black-hat's `black_hat/index.js` so command
 * files that `require("../black_hat")` work unchanged. Every export is backed
 * by a PRIEST MD adapter (settings, group settings, sudo, notes, group cache,
 * serializer, utilities).
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../../config/config');
const logger = require('../../../../shared/logger');

const { gmd, commands, evt } = require('./gmdCmds');
const gmdFns = require('./gmdFunctions');
const gmdFns2 = require('./gmdFunctions2');
const gmdFns3 = require('./gmdFunctions3');
const { createContext, createContext2 } = require('./gmdHelpers');
const { getContextInfo } = require('./contextInfo');
const settingsStore = require('./database/settings');
const groupSettingsStore = require('./database/groupSettings');
const sudoStore = require('./database/sudo');
const notesStore = require('./database/notes');
const tempmailStore = require('./database/tempmail');
const autoUpdate = require('./database/autoUpdate');
const groupCache = require('./connection/groupCache');
const serializer = require('./connection/serializer');
const gameHandler = require('./gameHandler');

module.exports = {
  // Registry core
  gmd,
  commands,
  evt,

  // Config & logging
  config,
  logger,

  // Emojis + Gifted API config
  emojis: gmdFns2.emojis,
  GiftedTechApi: gmdFns2.GiftedTechApi,
  GiftedApiKey: gmdFns2.GiftedApiKey,

  // Context builders
  createContext,
  createContext2,
  getContextInfo,

  // Settings store (PRIEST MD-branded defaults)
  ...settingsStore,

  // Group settings store
  ...groupSettingsStore,

  // Sudo store
  ...sudoStore,

  // Notes store
  ...notesStore,

  // Temp mail store
  ...tempmailStore,

  // Updater commit-hash store
  ...autoUpdate,

  // Group cache adapter (getGroupMetadata / getLidMapping / cache)
  ...groupCache,

  // Serializer (PRIEST MD canonical JID/message utils)
  ...serializer,

  // Games
  handleGameMessage: gameHandler.handleGameMessage,
  clearGameTimeout: gameHandler.clearGameTimeout,
  clearDiceTimeout: gameHandler.clearDiceTimeout,
  setMoveTimeout: gameHandler.setMoveTimeout,
  setWcgTurnTimeout: gameHandler.setWcgTurnTimeout,
  setDiceTurnTimeout: gameHandler.setDiceTurnTimeout,
  renderBoard: gameHandler.renderBoard,
  getPlayerName: gameHandler.getPlayerName,
  gameTimeouts: gameHandler.gameTimeouts,
  diceTimeouts: gameHandler.diceTimeouts,

  // Full utility sets (gmdFunctions / gmdFunctions2 / gmdFunctions3)
  ...gmdFns,
  ...gmdFns3,
};

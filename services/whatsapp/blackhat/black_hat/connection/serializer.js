/**
 * black_hat/connection/serializer.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Black Hat command bridge
 * Re-exports PRIEST MD's canonical serializer for black-hat command modules
 * that require "../black_hat/connection/serializer".
 * -----------------------------------------------------------------------------
 */

'use strict';

const {
  standardizeJid,
  convertLidToJid,
  serializeMessage,
} = require('../../../serializer');

module.exports = {
  standardizeJid,
  convertLidToJid,
  serializeMessage,
};

/**
 * black_hat/database/autoUpdate.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Black Hat command bridge
 * setCommitHash / getCommitHash — used by the `update` command. Stored in a
 * JSON file under config/blackhat-data/ (no Sequelize).
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', '..', '..', '..', 'config', 'blackhat-data', 'commit-hash.json');

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8')).hash || null;
  } catch (e) {
    return null;
  }
}

async function setCommitHash(hash) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ hash: String(hash || '') }));
    return true;
  } catch (e) {
    return false;
  }
}

async function getCommitHash() {
  return read();
}

module.exports = { setCommitHash, getCommitHash };

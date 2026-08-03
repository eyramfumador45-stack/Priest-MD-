/**
 * scheduler/cleanup.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Cleanup job: removes stale session folders and expired log files, and purges
 * old database records (logs, audit trails, pairing requests).
 * -----------------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');

const config = require('../config/config');
const logger = require('../shared/logger');
const { safe } = require('../shared/utils/safe');

const ROOT = path.join(__dirname, '..');

async function run() {
  const clean = [];

  // Clean old log files beyond retention.
  const retentionDays = config.logging.fileRetentionDays || 7;
  const logsDir = path.join(ROOT, 'logs');
  if (fs.existsSync(logsDir)) {
    for (const file of fs.readdirSync(logsDir)) {
      const full = path.join(logsDir, file);
      const stat = fs.statSync(full);
      const ageDays = (Date.now() - stat.mtimeMs) / 86400000;
      if (ageDays > retentionDays) {
        fs.unlinkSync(full);
        clean.push(file);
      }
    }
  }

  // Clean old session folders for unpaired/pending sessions (beyond configured days).
  const sessionCleanupDays = config.whatsapp.sessionCleanupDays || 30;
  const sessionsDir = path.join(ROOT, 'sessions');
  if (fs.existsSync(sessionsDir)) {
    for (const dir of fs.readdirSync(sessionsDir)) {
      const full = path.join(sessionsDir, dir);
      const stat = fs.statSync(full);
      const ageDays = (Date.now() - stat.mtimeMs) / 86400000;
      if (ageDays > sessionCleanupDays && !fs.existsSync(path.join(full, 'creds.json'))) {
        fs.rmSync(full, { recursive: true, force: true });
        clean.push(`session/${dir}`);
      }
    }
  }

  // Purge old DB records (only when the database is actually connected).
  if (require('../database').isConnected()) {
    await safe(async () => {
      const models = require('../database/models');
      const cutoff = new Date(Date.now() - 30 * 86400000);
      await models.Log.deleteMany({ createdAt: { $lt: cutoff } });
      await models.AuditLog.deleteMany({ createdAt: { $lt: cutoff } });
      await models.Cooldown.deleteMany({ expiresAt: { $lt: new Date() } });
    }, null, 'cleanup-db');
  }

  logger.info('[cleanup] completed', { removed: clean.length });
  return clean;
}

module.exports = { run };

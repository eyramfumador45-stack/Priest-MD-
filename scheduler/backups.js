/**
 * scheduler/backups.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Automatic backup job — creates a tar.gz of sessions/config/logs and prunes
 * backups older than the retention window.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logger = require('../shared/logger');

const ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'backups');
const RETENTION_DAYS = 14;

async function run() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const out = path.join(BACKUP_DIR, `priestmd-auto-${stamp}.tar.gz`);

    const targets = ['sessions', 'config', 'logs', 'assets/logo']
      .filter((t) => fs.existsSync(path.join(ROOT, t)))
      .map((t) => `"${path.join(ROOT, t)}"`)
      .join(' ');

    execSync(`tar -czf "${out}" ${targets}`, { cwd: ROOT, stdio: 'pipe' });

    // Prune old backups.
    for (const file of fs.readdirSync(BACKUP_DIR)) {
      const full = path.join(BACKUP_DIR, file);
      const ageDays = (Date.now() - fs.statSync(full).mtimeMs) / 86400000;
      if (ageDays > RETENTION_DAYS) fs.unlinkSync(full);
    }

    logger.info('[backups] automatic backup created', { file: path.basename(out) });
    return out;
  } catch (err) {
    logger.error('[backups] failed', { error: err.message });
    return null;
  }
}

module.exports = { run };

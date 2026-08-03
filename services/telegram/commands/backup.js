/**
 * services/telegram/commands/backup.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /backup — Create a full backup (sessions + config + logs) as a tar.gz.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const BACKUP_DIR = path.join(ROOT, 'backups');

module.exports = {
  name: 'backup',
  description: 'Create a backup',
  handler: async (ctx) => {
    try {
      if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const out = path.join(BACKUP_DIR, `priestmd-backup-${stamp}.tar.gz`);
      const targets = ['sessions', 'config', 'logs', 'assets/logo'];
      const includeArgs = targets
        .filter((t) => fs.existsSync(path.join(ROOT, t)))
        .map((t) => `"${path.join(ROOT, t)}"`)
        .join(' ');

      execSync(`tar -czf "${out}" ${includeArgs}`, { cwd: ROOT, stdio: 'pipe' });
      await ctx.reply(`✅ Backup created.\n\nFile: \`${out}\``);
    } catch (err) {
      await ctx.reply(`❌ Backup failed: ${err.message}`);
    }
  },
};

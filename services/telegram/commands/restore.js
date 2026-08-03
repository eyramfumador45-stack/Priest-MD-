/**
 * services/telegram/commands/restore.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * /restore — List available backups and restore session data.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const BACKUP_DIR = path.join(ROOT, 'backups');

module.exports = {
  name: 'restore',
  description: 'Restore from a backup',
  handler: async (ctx) => {
    if (!fs.existsSync(BACKUP_DIR)) {
      await ctx.reply('No backups found. Use /backup first.');
      return;
    }
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.tar.gz'));
    if (!files.length) {
      await ctx.reply('No backups found. Use /backup first.');
      return;
    }

    // If a filename is given, restore it.
    const raw = (ctx.message?.text || '').split(' ').slice(1).join(' ').trim();
    let target = null;
    if (raw) {
      target = files.find((f) => f.includes(raw)) || null;
    }

    if (!target) {
      const lines = ['🗂️ *Available Backups*\n', ...files.map((f) => `• \`${f}\``)];
      lines.push('\nTo restore: `/restore <filename>`');
      await ctx.reply(lines.join('\n'));
      return;
    }

    try {
      execSync(`tar -xzf "${path.join(BACKUP_DIR, target)}" -C "${ROOT}"`, { stdio: 'pipe' });
      await ctx.reply(`✅ Restored from \`${target}\`.\n\nRestart the bot to apply session changes.`);
    } catch (err) {
      await ctx.reply(`❌ Restore failed: ${err.message}`);
    }
  },
};

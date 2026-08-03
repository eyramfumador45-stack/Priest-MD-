/**
 * services/whatsapp/middleware/permissions.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Enforces owner/admin/premium/group-only/private-only restrictions declared
 * in command metadata, plus the runtime permission model.
 * -----------------------------------------------------------------------------
 */

'use strict';

const { resolveLevel, levels } = require('../../../config/permissions');

module.exports = function permissionsMiddleware({ groups = {} } = {}) {
  const groupAdminCache = new Map(); // groupJid -> Set(adminJid)

  async function isGroupAdmin(ctx) {
    const key = ctx.jid;
    let admins = groupAdminCache.get(key);
    if (!admins) {
      try {
        const meta = await ctx.sock.groupMetadata(key);
        admins = new Set(
          (meta.participants || [])
            .filter((p) => p.admin)
            .map((p) => p.id)
        );
        groupAdminCache.set(key, admins);
        setTimeout(() => groupAdminCache.delete(key), 60000);
      } catch (e) {
        admins = new Set();
      }
    }
    return admins.has(ctx.sender);
  }

  return async function permissions(ctx, next) {
    if (!ctx.isCommand || !ctx.command) return next();
    const cmd = ctx.command;

    // Owner-only
    if (cmd.owner) {
      const ok = ctx.config.isOwner(ctx.senderNumber) || ctx.config.isOwner(ctx.sender);
      if (!ok) {
        ctx._handled = true;
        await ctx.reply({ text: '🔒 This command is *owner only*.' });
        return;
      }
      return next();
    }

    // Admin-only (framework admins, not group admins)
    if (cmd.admin) {
      const ok = ctx.config.isAdmin(ctx.senderNumber) || ctx.config.isAdmin(ctx.sender);
      if (!ok) {
        ctx._handled = true;
        await ctx.reply({ text: '🔒 This command is *admin only*.' });
        return;
      }
      return next();
    }

    // Premium-only
    if (cmd.premium) {
      const ok = ctx.config.isPremium(ctx.senderNumber) || ctx.config.isPremium(ctx.sender);
      if (!ok) {
        ctx._handled = true;
        await ctx.reply({ text: '💎 This command is *premium only*.' });
        return;
      }
      return next();
    }

    // Group-only commands
    if (cmd.onlyGroup && !ctx.isGroup) {
      ctx._handled = true;
      await ctx.reply({ text: '👥 This command only works in *groups*.' });
      return;
    }

    // Private-only commands
    if (cmd.private && ctx.isGroup) {
      ctx._handled = true;
      await ctx.reply({ text: '💬 Please use this command in a *private chat*.' });
      return;
    }

    // Group admin commands (group-scoped moderation)
    if (cmd.group && ctx.isGroup) {
      const isAdmin = await isGroupAdmin(ctx);
      const isOwner = ctx.config.isOwner(ctx.senderNumber) || ctx.config.isOwner(ctx.sender);
      if (!isAdmin && !isOwner) {
        ctx._handled = true;
        await ctx.reply({ text: '👮 This command is for *group admins* only.' });
        return;
      }
      return next();
    }

    // Declared permission level gate
    if (cmd.permissions && cmd.permissions.length) {
      const allowed = cmd.permissions.map((r) => resolveLevel(r));
      const max = Math.max(...allowed);
      let userLevel = levels.USER;
      if (ctx.config.isOwner(ctx.senderNumber) || ctx.config.isOwner(ctx.sender)) userLevel = levels.OWNER;
      else if (ctx.config.isAdmin(ctx.senderNumber) || ctx.config.isAdmin(ctx.sender)) userLevel = levels.ADMIN;
      else if (ctx.isGroup && (await isGroupAdmin(ctx))) userLevel = levels.GROUP_ADMIN;

      if (userLevel < max) {
        ctx._handled = true;
        await ctx.reply({ text: '🔒 You do not have permission to use this command.' });
        return;
      }
      return next();
    }

    return next();
  };
};

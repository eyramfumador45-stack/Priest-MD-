/**
 * shared/utils/leveling.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * XP / level-up logic. Best-effort, non-blocking — never affects message flow.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../logger');

const XP_PER_MSG = 15;
const LEVEL_BASE = 100;   // xp needed for level 1
const LEVEL_FACTOR = 1.6; // growth per level

/** XP required to reach a given level. */
function xpForLevel(level) {
  return Math.floor(LEVEL_BASE * Math.pow(level - 1, LEVEL_FACTOR));
}

/** Compute the level for a given total XP. */
function levelForXp(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

/**
 * Award XP to a user. Fire-and-forget (call without await).
 * @param {object} ctx command/message context
 */
async function awardXp(ctx) {
  try {
    if (ctx.isBot) return;
    const { User } = require('../../database/models');
    const xp = XP_PER_MSG + Math.floor(Math.random() * 10);

    const user = await User.findOneAndUpdate(
      { jid: ctx.sender },
      { $setOnInsert: { jid: ctx.sender, number: ctx.senderNumber, name: ctx.msg?.pushName || '' } },
      { upsert: true, new: true }
    );

    const newXp = (user.xp || 0) + xp;
    const newLevel = levelForXp(newXp);
    const leveledUp = newLevel > (user.level || 1);

    await User.updateOne(
      { jid: ctx.sender },
      { $set: { xp: newXp, level: newLevel, lastSeen: new Date() } }
    );

    if (leveledUp) {
      logger.info(`[leveling] ${ctx.senderNumber} reached level ${newLevel}`);
      await ctx.reply({ text: `🎉 *Level up!*\n\nCongratulations, you reached *level ${newLevel}*!` }).catch(() => {});
    }
  } catch (err) {
    // Non-fatal: DB down or transient error.
    logger.debug('[leveling] skipped', { error: err.message });
  }
}

module.exports = { awardXp, xpForLevel, levelForXp, XP_PER_MSG };

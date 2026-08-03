/**
 * config/permissions.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Centralised permission definitions shared by middleware and command guards.
 * -----------------------------------------------------------------------------
 */

'use strict';

const constants = require('./constants');

/** Named role keys -> numeric level. */
const ROLE_LEVELS = Object.freeze({
  user: constants.PERMISSION_LEVELS.USER,
  member: constants.PERMISSION_LEVELS.USER,
  groupAdmin: constants.PERMISSION_LEVELS.GROUP_ADMIN,
  admin: constants.PERMISSION_LEVELS.ADMIN,
  mod: constants.PERMISSION_LEVELS.MODERATOR,
  moderator: constants.PERMISSION_LEVELS.MODERATOR,
  premium: constants.PERMISSION_LEVELS.PREMIUM,
  owner: constants.PERMISSION_LEVELS.OWNER,
});

/**
 * Resolve a role identifier (name or number) to a numeric level.
 * @param {string|number} role
 * @returns {number}
 */
function resolveLevel(role) {
  if (typeof role === 'number') return role;
  const key = String(role || '').toLowerCase();
  if (ROLE_LEVELS[key] !== undefined) return ROLE_LEVELS[key];
  const asNumber = Number(key);
  if (!Number.isNaN(asNumber)) return asNumber;
  return constants.PERMISSION_LEVELS.USER;
}

/**
 * Permission map used by command metadata. Each command may declare:
 *   permissions: ['owner']            -> single role
 *   permissions: ['owner','admin']    -> any of the listed roles
 *   permissions: 'owner'              -> shorthand
 */
const permissions = Object.freeze({
  levels: constants.PERMISSION_LEVELS,
  roles: ROLE_LEVELS,
  resolveLevel,
  hasPermission(level, required) {
    return level >= resolveLevel(required);
  },
});

module.exports = permissions;

/**
 * black_hat/gmdFunctions2.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Black Hat command bridge
 * Minimal adaptation of black-hat's gmdFunctions2: the emoji list and the
 * Gifted API base URL / API key used by AI & downloader commands.
 *
 * The API key can be overridden via GIFTED_API_KEY (env) or
 * API_KEYS={"gifted":"..."}. Defaults to the donor project's public key so
 * commands work out of the box; replace with your own to avoid rate limits.
 * -----------------------------------------------------------------------------
 */

'use strict';

const logger = require('../../../../shared/logger');
const config = require('../../../../config/config');

const emojis = [
  '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛',
  '💚', '💙', '💜', '🤎', '🖤', '🤍', '🔥', '💯', '♨️', '💢', '💬', '💭', '💤',
  '🌐', '🎴', '🎭️', '🔔', '🎼', '🎵', '🎶', '⚠️', '⛔️', '🚫', '📵', '🔞', '☢️',
  '✅', '☑️', '✔️', '❌', '❎', '🔰', '⭕️', '💲', '♻️', '⚜️', '🔱', '📛', '💠',
  '🎮️', '🎰', '🎲', '♟️', '🧩', '🧸', '🎨', '🧵', '👑', '💎', '📢', '📣', '🎙️',
  '🎤', '🎧️', '📻️', '📱', '📲', '☎️', '💻️', '🖥️', '⌨️', '🖱️', '💾', '📷️',
  '📹', '💡', '🔦', '📔', '📖', '📰', '🔖', '🏷️', '💰️', '💳️', '✉️', '📧',
  '📨', '📩', '📥', '📦️', '✏️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📈',
  '📊', '📌', '📍', '📎', '🔑', '🗝️', '🔨', '🛠️', '⚙️', '🧰', '🧲', '⚗️',
  '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '💊', '🚪', '🛏️', '🛋️', '🛒',
  '🏆️', '🏅', '🥇', '🥈', '🥉', '⚽️', '🏀', '🏐', '🎾', '🎳', '🏏', '🏓',
  '⛳️', '🎣', '🎯', '🎱', '🚀', '🛸', '✈️', '🚁', '⛵️', '🚤', '🛳️', '🗺️',
  '🌍️', '🌎️', '🌏️', '🌈', '⛅️', '🌤️', '🌧️', '⛈️', '❄️', '☃️', '🔥', '💧',
  '🌊', '💥', '💦', '✨', '⭐️', '🌟', '💫', '🌙', '☀️', '🪐', '😀', '😄',
  '😂', '🤣', '😊', '😍', '🤩', '😘', '😎', '🤓', '🥳', '😇', '🥰', '🤗',
  '🤔', '🙄', '😴', '🤤', '🥺', '😢', '😭', '😱', '🤯', '😤', '😡', '🤬',
  '👻', '👽️', '🤖', '💀', '☠️', '👾', '🙈', '🙉', '🙊', '👍️', '👎️',
  '👏', '🙌', '🤝', '🙏', '💪', '👀', '🧠', '👂️', '👃', '👄', '💋',
  '👶', '🧒', '👦', '👧', '👨', '👩', '🧔', '👴', '👵', '💃', '🕺',
  '🏃', '🚶', '🧍', '🧎', '🛀', '🛌', '👭', '👫', '👬', '💏', '💑', '👪️',
  '🗣️', '👤', '👥', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨',
  '🦁', '🐯', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦️', '🦆', '🦅', '🦉',
  '🐺', '🐴', '🦄', '🐝', '🦋', '🐌', '🐢', '🐍', '🐊', '🐬', '🐳', '🐟️',
  '🦈', '🦑', '🦀', '🐚', '🌺', '🌸', '🌼', '🌻', '🌷', '🌹', '🥀', '🌵',
  '🌲', '🌳', '🍀', '🍁', '🍂', '🍃', '🍇', '🍉', '🍊', '🍋', '🍌', '🍍',
  '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅', '🥑', '🍆', '🥔',
  '🥕', '🌽', '🌶️', '🍄', '🥜', '🍞', '🥐', '🥨', '🧀', '🍖', '🍗', '🥩',
  '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🍿', '🧁', '🍰', '🎂', '🍫',
  '🍬', '🍭', '🍦', '🍧', '🍨', '🍩', '🍪', '☕️', '🍵', '🍺', '🍻', '🥂',
  '🥤', '🧃', '🔪', '🍽️', '🍴', '🥄', '🎁', '🎈', '🎉', '🎊', '🎃', '🎄',
  '🧨', '🎆', '🎇', '🎑', '🕯️', '🎓️', '🎩', '🧢', '👒', '🎽', '👔', '👗',
  '👘', '🥻', '🩱', '👙', '🧦', '🧤', '🧣', '🕶️', '🥽', '👓️', '💍', '🕰️',
  '⌚️', '⏰', '⏳️', '⌛️', '🗓️', '📆', '📋️', '🖋️', '🖊️', '📎', '🔗',
];

/** Gifted API base URL (public endpoint used by the donor project). */
const DEFAULT_API = 'https://api.gifted.co.ke';
/** Public default key from the donor project (override via GIFTED_API_KEY). */
const DEFAULT_KEY = '_0u5aff45,_0l1876s8qc';

function resolveApiKey() {
  const fromEnv = process.env.GIFTED_API_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    const fromConfig = config.apiKeys?.gifted;
    if (fromConfig && String(fromConfig).trim()) return String(fromConfig).trim();
  } catch (e) { /* ignore */ }
  return DEFAULT_KEY;
}

const GiftedTechApi = DEFAULT_API;
const GiftedApiKey = resolveApiKey();

module.exports = {
  logger,
  emojis,
  GiftedTechApi,
  GiftedApiKey,
};

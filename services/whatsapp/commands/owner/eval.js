/**
 * commands/owner/eval.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * .eval <code> — evaluate JavaScript in the bot's context (owner only, DANGER).
 * -----------------------------------------------------------------------------
 */

'use strict';

module.exports = {
  name: 'eval',
  description: 'Evaluate JavaScript (owner only)',
  aliases: ['ev'],
  category: 'owner',
  usage: '.eval <code>',
  owner: true,
  private: true,
  cooldown: 5000,
  execute: async (ctx) => {
    const code = ctx.argList.join(' ');
    if (!code) return ctx.reply({ text: 'Usage: `.eval <code>`' });
    try {
      // eslint-disable-next-line no-eval
      const result = await eval(`(async () => { ${code} })()`);
      const out = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      await ctx.reply({ text: `✅ Result:\n\`\`\`\n${String(out).slice(0, 3500)}\n\`\`\`` });
    } catch (err) {
      await ctx.reply({ text: `❌ Error:\n\`\`\`\n${err.message}\n\`\`\`` });
    }
  },
};

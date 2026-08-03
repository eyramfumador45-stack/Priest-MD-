/**
 * security/captcha.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Captcha verification for new group members. A new joiner is sent a simple
 * math captcha; if they answer in the group within the expiry window they are
 * verified, otherwise the configured action (kick) is taken.
 * -----------------------------------------------------------------------------
 */

'use strict';

const config = require('../../../config/config');
const constants = require('../../../config/constants');
const helpers = require('../../../shared/helpers');

const pending = new Map(); // `${groupJid}:${userJid}` -> {answer, expiresAt}

function enabled() {
  return config.security?.captcha?.enabled === true;
}

function generate() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer;
  if (op === '+') answer = a + b;
  else if (op === '-') answer = a - b;
  else answer = a * b;
  return { question: `${a} ${op} ${b}`, answer: String(answer) };
}

async function onParticipants({ id, participants, action }, session) {
  if (action !== 'add') return;
  const length = config.security?.captcha?.length || 5;
  const expiryMs = config.security?.captcha?.expiryMs || 300000;
  for (const p of participants) {
    const { question, answer } = generate();
    const key = `${id}:${p}`;
    pending.set(key, { answer, expiresAt: Date.now() + expiryMs });
    // DM the joiner.
    await session.sock.sendMessage(p, {
      text: `🔐 *Captcha verification*\n\nAnswer: *${question} = ?*\n\nSend the answer in the group to verify you are human. This expires in ${Math.round(expiryMs / 1000)}s.`,
    }).catch(() => {});
    // Schedule expiry kick.
    setTimeout(async () => {
      const rec = pending.get(key);
      if (rec && Date.now() > rec.expiresAt) {
        pending.delete(key);
        const fakeCtx = { sock: session.sock, jid: id, isGroup: true };
        await session.security.act(config.security?.captcha?.action || 'kick', fakeCtx, p, 'Captcha not answered in time.');
      }
    }, expiryMs + 1000);
  }
}

async function onMessage(ctx, session) {
  if (!ctx.isGroup) return false;
  const key = `${ctx.jid}:${ctx.sender}`;
  const rec = pending.get(key);
  if (!rec) return false;
  if (String(ctx.text || '').trim() === rec.answer) {
    pending.delete(key);
    await ctx.reply({ text: '✅ Verified! Welcome.' });
    return true;
  }
  return false;
}

module.exports = { name: 'captcha', enabled, onParticipants, onMessage };

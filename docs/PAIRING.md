# Pairing

*Priest MD — Developed by Inkora Systems*

Priest MD pairs WhatsApp numbers through **Telegram** using the official WhatsApp
**pairing code** (no QR required).

## Flow

1. `/start` your Telegram bot.
2. `/pair`.
3. Send the phone number in **international format** (no `+`, no spaces),
   e.g. `233241234567`.
4. Priest MD calls Baileys `requestPairingCode(number)` and shows the 8-character code.
5. On the phone: **WhatsApp → Settings → Linked Devices → Link a Device →
   Link with phone number instead**, enter the code.
6. The bot detects `connection === 'open'` and confirms via Telegram.

## Implementation

- `services/telegram/pairing/index.js` — the flow.
- `services/telegram/pairing/store.js` — per-user conversation state (5-min timeout).
- `services/whatsapp/index.js` → `requestPairingCode()`.
- `services/whatsapp/socket.js` → `update['pairing.code']` event.

## Multiple sessions

Each number gets its own session folder:

```
sessions/
  233241234567/creds.json, keys/
  491512345678/creds.json, keys/
```

Unlimited sessions are supported. The Telegram dashboard (`/sessions`) lists them all.

## Reconnection without re-pairing

Credentials persist on disk, so after a restart the session manager restores and
reconnects automatically. Re-pairing is only needed after a logout.

## Config

```json
"whatsapp": { "usePairingCode": true, "allowQr": true },
"telegram": { "allowPairing": true, "maxSessionsPerUser": 10 }
```

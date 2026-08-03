# WhatsApp Engine

*Priest MD — Developed by Inkora Systems*

The WhatsApp engine connects via **Baileys Multi-Device** and is organised under
`services/whatsapp/`.

## Components

| File | Responsibility |
|------|----------------|
| `index.js` | `WhatsAppService` — one session (lifecycle, pairing, reconnect, persistence) |
| `socket.js` | Baileys socket factory with disk-backed auth state + hardened socket options |
| `connection.js` | Connection lifecycle state machine — reconnect w/ exponential backoff, session wipe on bad session/logout, terminal states |
| `serializer.js` | Canonical JID & message serialization (LID-aware, device-suffix stripping, button/list responses) |
| `lid-store.js` | In-memory LID → phone-JID mapping store (learned from incoming messages) |
| `super-users.js` | Super-user (owner/admin) JID resolution for privilege checks |
| `session-manager.js` | Orchestrates unlimited sessions; restores on startup; optional `SESSION_ID` bootstrap |
| `ctx-builder.js` | Builds the rich execution context |
| `message-handler.js` | Runs the command pipeline (with 60s message dedupe) |
| `commands/` | Auto-loaded commands |
| `events/` | One handler per event |
| `middleware/` | Pre-command chain |
| `plugins/` | Drop-in plugins |
| `security/` | Independent security modules |

## Lifecycle

```
start()
  └─ createSocket(number)            # useMultiFileAuthState(sessions/<number>)
       └─ setupConnectionHandler()   # connection.js — reconnect/backoff state machine
       └─ attachHandlers()           # events/
       └─ SecurityManager()          # security/
       └─ requestPairingCode()       # if enabled
  └─ emit events (connecting / connected / closed / qr / pairing-code / terminal)
  └─ auto-reconnect with exponential backoff (5s → 300s cap)
```

### Disconnect handling (`connection.js`)

Every Baileys disconnect reason maps to a concrete action:

| Reason | Action |
|--------|--------|
| `badSession` (500) / `loggedOut` (401) | **Wipe session credentials** from disk → session offline → re-pair via Telegram |
| `connectionReplaced` (440) | **Stop session** (another device took over) |
| `connectionClosed` / `connectionLost` / `restartRequired` / `timedOut` | **Reconnect** with exponential backoff, capped attempts |
| unknown / no status code | Reconnect (never treated as bad session) |
| clean close (no error, e.g. `sock.end()`) | **None** — intentional shutdown, credentials preserved |

Max attempts and base delay are configurable:
`WHATSAPP_MAX_RECONNECT_RETRIES` / `WHATSAPP_RECONNECT_DELAY_MS`
(or `configuration.json` → `whatsapp.maxReconnectRetries` / `reconnectDelayMs`).

## Message flow

`messages.upsert` → dedupe (60s window per message id) → `handleMessage()` →
`buildContext()` (serializer canonicalizes JIDs/sender/text) → detect command →
resolve in registry → run middleware chain → `command.execute(ctx)`.

## Session persistence

- Credentials: `sessions/<number>/creds.json` + keys (on disk — git-ignored).
- Metadata: `Session` model in MongoDB (skipped silently when DB is offline).
- `session-manager.restoreAll()` reconnects existing sessions on boot.
- Optional `SESSION_ID` env import: base64 (optionally gzipped) of a
  `creds.json` blob, optionally prefixed with `PriestMD~`, written into a
  session directory only when no credentials exist yet.

## Config

```json
"whatsapp": {
  "autoReconnect": true,
  "reconnectDelayMs": 5000,
  "maxReconnectRetries": 10,
  "usePairingCode": true,
  "allowQr": true,
  "syncFullHistory": false,
  "markOnline": true,
  "sessionCleanupDays": 30,
  "botIcon": {
    "enabled": true,
    "file": "assets/bot-icon.png"
  },
  "connectMusic": {
    "enabled": true,
    "file": "assets/music/connect.mp3",
    "target": "self"
  }
}
```

Overridable via environment: `WHATSAPP_AUTO_RECONNECT`,
`WHATSAPP_PAIRING_CODE`, `WHATSAPP_RECONNECT_DELAY_MS`,
`WHATSAPP_MAX_RECONNECT_RETRIES`, `WHATSAPP_BOT_ICON`,
`WHATSAPP_CONNECT_MUSIC`, `WHATSAPP_CONNECT_MUSIC_TARGET`.

## On-connect actions

When a session first comes online (`connection.open`) the engine runs
`services/whatsapp/connect-actions.js`:

1. **Bot icon** — sets the bot number's WhatsApp profile picture from
   `assets/bot-icon.png` (Baileys auto-resizes to 640×640). Replace the file
   with any square image (JPG/PNG) or point `WHATSAPP_BOT_ICON` elsewhere.
   Runs once per session lifetime.
2. **Connect music** — sends the audio in `assets/music/connect.mp3` (a 30s
   preview of *Elevate* by DJ Khalil, Spider-Verse soundtrack) as a normal
   audio message. `target: "self"` delivers it to the bot's own chat;
   `target: "owner"` delivers it to the first number in `OWNERS`. Replace the
   file with any MP3/OGG/M4A you prefer.

Both actions fail silently (logged warning) when the file is missing, the
socket can't perform the action, or the API errors — the session stays online.

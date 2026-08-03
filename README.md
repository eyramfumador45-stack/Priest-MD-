# Priest MD

**Priest MD — Developed by Inkora Systems**

Version **1.0.0** · WhatsApp Multi-Device Bot Framework with a Telegram Control Panel

![Priest MD logo](assets/logo/icon-round.png)

> A modular, enterprise-grade **Multi-Device WhatsApp Bot Framework** built with Node.js.
> WhatsApp is where the bot operates; **Telegram is the control panel** that pairs accounts,
> manages sessions, monitors activity and administers the framework remotely.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Pairing a WhatsApp Number](#pairing-a-whatsapp-number)
- [Telegram Dashboard](#telegram-dashboard)
- [The WhatsApp Engine](#the-whatsapp-engine)
- [Creating Commands](#creating-commands)
- [Creating Plugins](#creating-plugins)
- [Middleware](#middleware)
- [Events](#events)
- [Security Modules](#security-modules)
- [The Database](#the-database)
- [Scheduler](#scheduler)
- [Deployment](#deployment)
- [Backups & Restoring Sessions](#backups--restoring-sessions)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Black Hat Commands](#black-hat-commands)

---

## Overview

Priest MD is a **modular, production-ready WhatsApp bot framework** that connects to
WhatsApp **Multi-Device (MD)** via [Baileys](https://github.com/whiskeysockets/Baileys).

Unlike traditional bots that rely on QR scanning, Priest MD supports **Telegram-based
pairing**: you send your phone number to the Telegram bot, it requests the official
WhatsApp **pairing code**, you enter that code in WhatsApp → *Linked Devices*, and the bot
goes online — automatically.

Everything is **modular**. Every feature lives in its own file. Adding a command or plugin
requires **zero changes to core code**. One broken module never crashes the framework.

---

## Architecture

The framework is split into **two independent services** that share the same database:

1. **WhatsApp Service** — the actual bot engine (Baileys MD).
2. **Telegram Service** — the control panel / pairing interface.

```
                    ┌──────────────────────────────┐
                    │       Telegram (control)     │
                    │  /pair  /sessions  /status   │
                    └──────────────┬───────────────┘
                                   │  pairing codes,
                                   │  session control
                                   ▼
                    ┌──────────────────────────────┐
                    │        Session Manager       │
                    │  (unlimited multi-session)   │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────┐        ┌────────────────┐          ┌──────────────┐
│  WhatsApp      │        │  Shared        │          │  MongoDB     │
│  Service       │        │  (logger,      │          │  (models)    │
│  (Baileys MD)  │        │  helpers, ...) │          │              │
└───────────────┘        └────────────────┘          └──────────────┘
```

- **WhatsApp Service** handles message events, commands, plugins, middleware, and the
  security framework — the actual bot.
- **Telegram Service** manages pairing, the session dashboard, and remote administration.
- They communicate through the **shared services** (logger, cache, helpers) and the
  **same database**.

---

## Project Structure

```
PriestMD/
├── index.js                     # Entry point — boots everything
├── package.json
├── .env.example                 # Environment template
├── README.md
├── config/
│   ├── constants.js             # App-wide constants
│   ├── branding.js              # Official brand + banner
│   ├── config.js                # Config loader (JSON + env)
│   ├── configuration.json       # Editable runtime config
│   └── permissions.js           # Role/level definitions
├── database/
│   ├── index.js                 # MongoDB connection manager
│   ├── models/                  # Mongoose models (Users, Groups, Sessions, ...)
│   └── migrations/              # Schema migrations
├── shared/
│   ├── logger/                  # Professional hierarchical logger
│   ├── helpers/                 # phone, time, format helpers
│   ├── utils/                   # safe execution, arg parsing, ...
│   └── cache/                   # In-memory TTL cache
├── services/
│   ├── whatsapp/                # The WhatsApp engine
│   │   ├── index.js             # WhatsAppService (one session)
│   │   ├── socket.js            # Baileys socket factory
│   │   ├── session-manager.js   # Multi-session orchestration
│   │   ├── ctx-builder.js       # Execution context
│   │   ├── message-handler.js   # Command pipeline
│   │   ├── commands/            # Auto-loaded commands
│   │   ├── events/              # One handler per event
│   │   ├── middleware/          # Middleware chain
│   │   ├── plugins/             # Auto-loaded plugins
│   │   └── security/            # Security modules
│   └── telegram/                # The control panel
│       ├── index.js             # TelegramBot class
│       ├── commands/            # /start /pair /sessions ...
│       ├── callbacks/           # Inline button routing
│       ├── pairing/             # Pairing flow + state
│       ├── dashboard/           # Session dashboard renderer
│       ├── middleware/          # Admin auth, rate limit
│       └── plugins/             # Telegram plugins
├── scheduler/                   # cleanup, backups, reminders
├── sessions/                    # Per-number credential folders
├── logs/                        # Rotated log files
└── assets/
    ├── logo/                    # Official logo (logo, icon-round, favicon, svg)
    ├── images/
    ├── stickers/
    └── sounds/
```

---

## Features

**WhatsApp Engine**

- Baileys Multi-Device support
- **Pair code** (primary) + QR code (optional)
- Session persistence & automatic session restore
- Auto-reconnect & graceful shutdown
- Unlimited **multi-session** (one folder per number)
- Automatic command loader (hot-reload)
- Plugin system (drop-in, no core edits)
- Middleware pipeline
- Event-driven (one handler per event)
- Security framework

**Telegram Control Panel**

- `/start /help /pair /status /sessions /restart /update /logs /plugins /settings /backup /restore /shutdown /menu /about /cancel`
- Inline session dashboard with action buttons
- Multi-session pairing & reconnection without re-pairing

**System**

- MongoDB persistence
- Professional logging (console + file + DB audit)
- Scheduler (cleanup, backups, reminders)
- Performance optimisations (caching, low footprint)
- Everything configurable, nothing hardcoded

**Black Hat Command Library** (integrated via compatibility bridge)

- **~250 extra commands** in 20 categories — AI (`.gemini`, `.chatai`),
  downloaders (`.fb`, `.tiktok`, `.ytmp3`, `.apk`), logo makers (`.fancy`,
  `.blackpinklogo`), games (`.ttt`, `.dice`, `.wcg`), group tools
  (`.antilink`, `.everyone`, `.vcf`), converters, search, notes, tempmail,
  sports, uploaders and more
- Black-hat command files are **unmodified** — a shim layer adapts their
  `gmd()`/`conText` API to PRIEST MD's engine
- Native commands win on name collisions; everything else just works with
  the same prefix (`.`)
- Owner-only commands (`.setbotname`, `.broadcast`, `$` shell, `>` eval) are
  gated by PRIEST MD's owner list (`OWNERS` in `.env`)
- Disable with `"blackhatCommands": false` in `config/configuration.json`
- See `docs/BLACKHAT-BRIDGE.md` for details

---

## Requirements

- **Node.js** 18+ (recommended 20)
- **MongoDB** (local or cloud, e.g. MongoDB Atlas)
- A **Telegram Bot Token** from [@BotFather](https://t.me/BotFather)
- A phone number to pair as the WhatsApp bot

---

## Installation

```bash
# 1. Clone / enter the project
cd PriestMD

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# edit .env with your Telegram token, MongoDB URI and owners

# 4. (Optional) set MongoDB URI in config/configuration.json too

# 5. Start
npm start
```

You should see the startup banner and, once configured, the Telegram control panel coming online.

---

## Configuration

Configuration lives in two places:

### 1. `config/configuration.json`
The primary, human-readable runtime configuration: bot name, prefixes, feature toggles,
security defaults, limits, cooldowns, ownership. Nothing is hardcoded in source.

### 2. `.env`
Secrets & overrides loaded by `config/config.js`:

| Variable            | Description                                         |
|---------------------|-----------------------------------------------------|
| `TELEGRAM_TOKEN`    | Telegram bot token (required for the panel)         |
| `TELEGRAM_ADMINS`   | Comma-separated IDs/usernames allowed to control    |
| `MONGODB_URI`       | MongoDB connection string                           |
| `OWNERS`            | Comma-separated bare WhatsApp numbers (owner role)  |
| `OWNER_NAME`        | Owner display name (branding)                       |
| `BOT_NAME`          | Bot display name                                    |
| `BOT_PREFIX`        | Comma-separated command prefixes                    |
| `SESSION_ID`        | Optional base64 (optionally gzipped) `creds.json` blob to import a WhatsApp session (`PriestMD~` prefix accepted) |
| `WHATSAPP_AUTO_RECONNECT` | `true`/`false` — enable automatic reconnection  |
| `WHATSAPP_PAIRING_CODE`   | `true`/`false` — request pairing code on new sessions |
| `WHATSAPP_RECONNECT_DELAY_MS` | Base reconnect delay in ms (exponential backoff) |
| `WHATSAPP_MAX_RECONNECT_RETRIES` | Max reconnect attempts before giving up     |
| `LOG_LEVEL`         | `trace` / `debug` / `info` / `warn` / `error` / `fatal` / `silent` |
| `API_KEYS`          | Optional JSON map of third-party API keys           |

The loader **deep-merges** `configuration.json` with environment overrides, so env vars
win. Branding lives in `config/branding.js`. Secrets live only in `.env` — never hardcode
them in source or `configuration.json`.

---

## Pairing a WhatsApp Number

1. Start the bot and send `/start` to your Telegram bot.
2. Send `/pair`.
3. Send the phone number in **international format** (no `+`, no spaces).
   Example: `233241234567`.
4. The bot requests the official **pairing code** and shows it to you.
5. On your phone: **WhatsApp → Settings → Linked Devices → Link a Device →
   Link with phone number instead**, and enter the code.
6. Priest MD detects the successful connection and confirms — the session is now online.

- Credentials are stored in `sessions/<number>/`.
- You can manage the session later via `/sessions` or `/restart <number>`.
- Reconnecting later does **not** require re-pairing — sessions are restored automatically
  on startup.

---

## Telegram Dashboard

`/sessions` opens the live dashboard:

```
📊 Priest MD — Session Dashboard
🟢 233241234567 — online · up 2h 3m
🔴 491512345678 — offline
Total: 2 session(s)
```

Each session row has an inline **Restart** button, plus **Pair New** and **Refresh**
buttons. `/status` shows system health (sessions, MongoDB, uptime, RAM).

---

## The WhatsApp Engine

The engine is powered by `services/whatsapp/`:

- **`socket.js`** — builds a Baileys socket with disk-backed auth state.
- **`index.js`** (`WhatsAppService`) — one session: lifecycle, pairing, reconnects,
  message pipeline, security, persistence.
- **`session-manager.js`** — owns all sessions; restores them from disk at startup.
- **`message-handler.js`** — builds the context and runs the command pipeline.
- **`commands/`** — auto-discovered commands.
- **`events/`** — one file per WhatsApp event.
- **`middleware/`** — the pre-command chain.
- **`security/`** — independent security modules.

Command flow for an incoming message:

```
messages.upsert (events/messages.js)
   └─> message-handler.handleMessage(sock, msg, session)
         ├─ buildContext()  -> rich ctx (sender, chat, text, reply/send helpers)
         ├─ detect prefix & command name
         ├─ resolve command from registry
         ├─ run middleware chain (maintenance → blacklist → rate-limit → logging
         │                       → permissions → cooldown)
         └─ if not short-circuited -> command.execute(ctx)
```

---

## Creating Commands

Commands live anywhere under `services/whatsapp/commands/` and are **auto-loaded**.
Just drop in a new file:

```js
// services/whatsapp/commands/fun/mycommand.js
module.exports = {
  name: 'mycommand',
  description: 'Does something fun',
  aliases: ['mc', 'mine'],
  category: 'fun',
  usage: '.mycommand <text>',
  permissions: [],
  cooldown: 5000,      // ms
  owner: false,        // owner-only
  admin: false,        // framework admin-only
  group: false,        // group-admin only
  onlyGroup: false,    // only in groups
  private: false,      // only in private chat
  premium: false,      // premium-only
  execute: async (ctx) => {
    // ctx.reply, ctx.sock.sendMessage, ctx.db models, ctx.config, ctx.helpers ...
    await ctx.reply({ text: 'Hello!' });
  },
};
```

### Command metadata

| Field         | Type     | Meaning                                  |
|---------------|----------|------------------------------------------|
| `name`        | string   | Command name (lowercase)                 |
| `description` | string   | Short description                        |
| `aliases`     | string[] | Alternate triggers                       |
| `category`    | string   | Grouping for `.help`                     |
| `usage`       | string   | Example usage                            |
| `permissions` | string[] | Required roles                           |
| `cooldown`    | number   | Cooldown in ms                           |
| `owner/admin/group/onlyGroup/private/premium` | boolean | Restriction flags |

### The `ctx` object

Every command receives a rich `ctx`:

- `ctx.sock` — Baileys socket
- `ctx.msg` — raw message
- `ctx.jid` — chat JID, `ctx.sender` — participant JID
- `ctx.isGroup`, `ctx.senderNumber`, `ctx.text`
- `ctx.prefix`, `ctx.commandName`, `ctx.args`, `ctx.argList`
- `ctx.reply(content)`, `ctx.send(jid, content)`, `ctx.react(emoji)`
- `ctx.db` — Mongoose models, `ctx.config`, `ctx.helpers`, `ctx.utils`, `ctx.logger`

---

## Creating Plugins

Dropping a plugin into `services/whatsapp/plugins/` **auto-loads** it. Plugins can add
commands and wire into the framework without editing core code:

```js
// services/whatsapp/plugins/my-plugin.js
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'Adds a /hello command',
  install(api) {
    api.registerCommand({
      name: 'hello',
      description: 'Says hello',
      category: 'fun',
      execute: async (ctx) => ctx.reply({ text: '👋 Hello!' }),
    });
  },
};
```

The `api` provides: `registerCommand`, `registerCommands`, `config`, `db`, `helpers`,
`utils`, `logger`.

Telegram plugins live in `services/telegram/plugins/` and receive `api.command(name, handler)`
plus `api.config` and `api.logger`.

---

## Middleware

Middleware runs before a command executes, in this default order:

`maintenance → blacklist → rate-limiter → logging → permissions → cooldown`

Each middleware is a module under `services/whatsapp/middleware/`:

```js
module.exports = function myMiddleware(deps) {
  return async function myMiddleware(ctx, next) {
    if (someCondition) {
      ctx._handled = true;              // short-circuit
      await ctx.reply({ text: 'Blocked.' });
      return;
    }
    return next();                       // continue the chain
  };
};
```

To add middleware, register it in the pipeline. The built-ins cover owner, admin,
permissions, cooldowns, blacklist, maintenance, rate limiting, logging and premium.

---

## Events

Every event has its own handler file in `services/whatsapp/events/`:

| File                     | Event                          |
|--------------------------|--------------------------------|
| `messages.js`            | `messages.upsert` (commands)   |
| `connection.js`          | `connection.update` (lifecycle)|
| `group-update.js`        | `groups.update`                |
| `participants-update.js` | `group-participants.update`    |
| `call.js`                | `call` (reject)                |
| `presence.js`            | `presence.update`              |
| `poll.js`                | poll updates                   |
| `reaction.js`            | reaction updates               |
| `message-delete.js`      | message deletions (anti-delete)|

Add a new event by dropping a file in that folder; it is auto-attached.

---

## Security Modules

`services/whatsapp/security/` contains **independent, independently-configurable**
modules. Each one can be turned on/off and given its own action in
`config/configuration.json`:

| Module            | Purpose                                   |
|-------------------|-------------------------------------------|
| `anti-hijack`     | Detects group takeover patterns           |
| `anti-raid`       | Blocks flood of new joins                 |
| `anti-spam`       | Flags message flooding                    |
| `anti-flood`      | Flags rapid messages                      |
| `anti-delete`     | Re-posts deleted messages (in events)     |
| `anti-bot`        | Detects bot behaviour                     |
| `anti-call`       | Rejects incoming calls (in events)        |
| `anti-link`       | Blocks links / invites                    |
| `anti-invite`     | Blocks invite links                       |
| `anti-nuke`       | Stops mass removal of members             |
| `anti-abuse`      | Filters abusive language                  |
| `anti-mention`    | Limits mass @-mentions                    |
| `anti-fake`       | Flags invalid phone numbers               |
| `anti-foreign`    | Removes non-allow-listed country codes    |
| `verification`    | Verification framework                    |
| `captcha`         | Math captcha for new members              |
| `audit logger`    | Writes an audit trail                     |

Example config:

```json
"antiLink": { "enabled": true, "action": "warn" }
```

Each module runs in isolation — a failure in one never affects the others.

---

## The Database

MongoDB via Mongoose. Models live in `database/models/`:

`User, Group, Session, Warning, Economy, Security, Permission, Statistic, Cooldown,
Log, Configuration, Premium, Plugin, AuditLog, PairingRequest, Reminder`

- Sessions store **lightweight metadata** in the DB; credentials stay on disk in
  `sessions/<number>/`.
- If MongoDB is unavailable the framework runs in **degraded mode** — it continues
  operating rather than crashing (DB operations fail fast instead of hanging).

Schema migrations live in `database/migrations/` and run automatically at startup.

---

## Scheduler

`scheduler/` runs periodic jobs via cron:

- `cleanup.js` — removes stale sessions/logs and old DB records.
- `backups.js` — creates automatic tar.gz backups.
- `reminders.js` — dispatches scheduled messages through the owning session.

---

## Deployment

**Simple (bare metal / VPS)**

```bash
npm install --production
cp .env.example .env   # configure
npm start
```

Run under a process manager (PM2) for auto-restart:

```bash
npm install -g pm2
pm2 start index.js --name priest-md
pm2 save
pm2 startup
```

**Docker** (example)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --production
CMD ["node", "index.js"]
```

> Note: session credentials are stored on disk. Mount `sessions/` as a persistent volume.

---

## Backups & Restoring Sessions

- Use `/backup` on Telegram (or `scheduler/backups.js`) to create a tar.gz of
  `sessions/`, `config/`, `logs/` and `assets/logo/`.
- Use `/restore <filename>` to restore. Backups are stored in `backups/`.

To **restore sessions manually**:

1. Stop the bot.
2. Copy the `sessions/` folder (each `sessions/<number>/creds.json` is a WhatsApp login)
   into the project.
3. Restart the bot — sessions are restored and reconnect automatically.

---

## Updating

```bash
git pull
npm install
pm2 restart priest-md   # or restart your process
```

Session data is untouched by updates, so there is no need to re-pair.

---

## Troubleshooting

| Symptom                              | Fix                                                              |
|--------------------------------------|------------------------------------------------------------------|
| No banner / process exits            | Check Node version (`node -v` ≥ 18).                             |
| Telegram not responding              | Set `TELEGRAM_TOKEN` in `.env`; message your bot's @BotFather.   |
| "Access denied" on Telegram          | Add your ID/username to `TELEGRAM_ADMINS`.                       |
| Pairing code never appears           | Ensure the number is valid & in international format; check logs. |
| Session won't connect                | Delete `sessions/<number>/` and re-pair.                         |
| MongoDB connection refused           | Start MongoDB or point `MONGODB_URI` at a live instance.         |
| Command does nothing                 | Check `config/configuration.json` `blacklist.commands`.          |
| Missing command in `.help`           | Confirm file is a valid command module and no syntax errors.     |
| Bot stays offline after restart      | Verify `sessions/<number>/creds.json` exists.                    |

Check `logs/error.log` and the `[app]`/`[session:...]` lines in `logs/info.log`.

---

## Black Hat Commands

PRIEST MD includes the **Black Hat MD command library** (~250 extra commands:
AI, downloaders, logo makers, games, group tools, converters, search, notes,
tempmail, sports, uploaders…) integrated through a compatibility bridge — the
black-hat command files run unmodified on PRIEST MD's engine.

- Same prefix as native commands: `.gemini`, `.fb`, `.ttt`, `.fancy`, `.onwa`, …
- Native commands win on name collisions (e.g. `.ping`, `.kick` stay PRIEST MD's).
- Settings commands (`.setbotname`, `.setprefix`, `.setmode`, …) persist to
  `config/blackhat-data/` — they do not touch MongoDB.
- Owner commands require your number in `OWNERS`.
- Optional: `GIFTED_API_KEY` in `.env` for the AI/downloader APIs.
- Disable entirely: `"blackhatCommands": false` in `config/configuration.json`.

Full details: [`docs/BLACKHAT-BRIDGE.md`](docs/BLACKHAT-BRIDGE.md).

---

## Documentation



- [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md)
- [`docs/PAIRING.md`](docs/PAIRING.md)
- [`docs/TELEGRAM.md`](docs/TELEGRAM.md)
- [`docs/WHATSAPP.md`](docs/WHATSAPP.md)
- [`docs/COMMANDS.md`](docs/COMMANDS.md)
- [`docs/PLUGINS.md`](docs/PLUGINS.md)
- [`docs/MIDDLEWARE.md`](docs/MIDDLEWARE.md)
- [`docs/EVENTS.md`](docs/EVENTS.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/DATABASE.md`](docs/DATABASE.md)
- [`docs/SCHEDULER.md`](docs/SCHEDULER.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)

---

## Branding

> **Priest MD** — Developed by **Inkora Systems**

The official circular logo is used consistently across the Telegram profile picture,
README, documentation, startup banner, dashboard, and GitHub repository. Do not redesign
or replace it unless instructed by Inkora Systems.

---

*Priest MD — Developed by Inkora Systems · Version 1.0.0*

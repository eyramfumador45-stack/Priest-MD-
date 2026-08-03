# Black Hat Command Bridge

*Priest MD — Developed by Inkora Systems*

PRIEST MD ships with the **Black Hat MD command library** (~250 commands)
integrated through a compatibility bridge. The black-hat command files are
**unchanged** — a shim layer makes their `gmd()` / `conText` API run on top of
PRIEST MD's engine.

## What's inside

```
services/whatsapp/blackhat/
├── index.js                  # bridge: registration, conText adapter, games hook
├── commands/                 # 25 black-hat command files (unmodified)
│   ├── ai.js  converter.js  downloader.js  games.js  general.js  group.js
│   ├── logo.js  notes.js  owner.js  owner2.js  play.js  religion.js
│   ├── search.js  search2.js  settings.js  settings2.js  shortener.js
│   ├── sports.js  tempmail.js  tools.js  tools2.js  tourl.js  updater.js
│   └── whatsapp.js
└── black_hat/                # shim modules (mirrors the donor's layout)
    ├── index.js              # barrel (settings, sudo, notes, utils, ...)
    ├── gmdCmds.js  gmdHelpers.js  gmdFunctions.js  gmdFunctions2.js
    ├── gmdFunctions3.js  contextInfo.js  wcg.js  gameAI.js  gameHandler.js
    ├── dictionary.js
    ├── connection/           # groupCache + serializer adapters
    └── database/             # miniModel stores (settings, sudo, notes, games…)
```

## How it works

1. **Registration** — `index.js` (app entry) loads the 20 native commands,
   then `blackhat.registerAll(registry)` requires every file in
   `blackhat/commands/` (each self-registers via `gmd()`), converts each entry
   into a native PRIEST MD command, and inserts it through
   `registry.registerExternal()`.
2. **conText adapter** — when a black-hat command runs, the bridge builds the
   exact `conText` object the handler expects (`mek`, `reply`, `react`, `args`,
   `q`, `sender`, `from`, `isGroup`, `isSuperUser`, `ownerNumber`, `botName`,
   `botPrefix`, `GiftedTechApi`, upload helpers, …) from PRIEST MD's context.
3. **Settings** — black-hat settings commands (`.setbotname`, `.setprefix`,
   `.setmode`, …) persist to `config/blackhat-data/*.json` via the miniModel —
   PRIEST MD's MongoDB design is untouched. Defaults are PRIEST MD-branded and
   read from `config/config.js` (`BOT_NAME`, `OWNERS`, `BOT_PREFIX`, …).
4. **Body commands** — `.on: 'body'` commands (`$` shell exec, `>` JS eval,
   both owner-gated) are dispatched from `message-handler.js` when a message is
   not a prefix command.
5. **Games** — tic-tac-toe (`ttt`), dice (`dice`), word-chain (`wcg`) run on
   `attachGameListener()`; game state is in-memory.

## Collision policy

Native PRIEST MD commands win. Black-hat commands whose name **or** alias
collides are skipped and counted at boot (e.g. `ping`, `roll`, `uptime`,
`kick`, `settings`). Everything else is available with the same prefix.

## Configuration

| Key / env | Effect |
|---|---|
| `features.blackhatCommands` (`configuration.json`) | `false` disables the whole bridge |
| `GIFTED_API_KEY` (`.env`) | API key for `.gemini`, `.chatai`, `.fb`, `.tiktok`, `.ytmp3`, … (falls back to the public default) |
| `TIME_ZONE` (`.env`) | timezone used by `.time`, `.runtime` style commands (default `UTC`) |

## Isolated & safe

- Every black-hat command runs inside `try/catch` — an error replies with
  `⚠️ <command> encountered an error` and never takes down the bot.
- The black-hat `$` / `>` body commands verify the sender is a super-user
  (owner numbers from `OWNERS` + the bot itself) before executing anything.
- The bridge uses **no Sequelize, no second database** — all stores are
  in-memory miniModels with optional JSON persistence under
  `config/blackhat-data/` (git-ignored).
- `gifted-baileys` is aliased to `@whiskeysockets/baileys`, so only one Baileys
  is installed.

## Known limitations

- Commands that need ffmpeg (`.toaudio`, `.tomp3`, `.tovideo`, `.sticker`,
  `.emojimix`, …) require the `ffmpeg-static` binary (installed automatically;
  on platforms without prebuilt binaries they reply with a friendly error).
- `.update` is disabled in effect: `BOT_REPO` is empty, so it reports an error
  instead of downloading code into PRIEST MD.
- Black-hat's anti-delete / chatbot / auto-bio listeners are **not** ported —
  PRIEST MD has its own security modules; only the command library was
  integrated.

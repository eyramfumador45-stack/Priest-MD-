# Configuration

*Priest MD — Developed by Inkora Systems*

Configuration is fully externalised — nothing is hardcoded in the framework source.

## Sources (merged in order, later wins)

1. `config/configuration.json` — primary human-readable config.
2. Environment variables (`.env` / `process.env`) via `config/config.js`.

`config/config.js` deep-merges these and exports a frozen config object exposed to every
command/plugin as `ctx.config`.

## Key files

| File                  | Purpose                                        |
|-----------------------|------------------------------------------------|
| `config/constants.js` | Immutable app constants & permission levels   |
| `config/branding.js`  | Official name, developer, banner, colors, logo|
| `config/config.js`    | Loader & helpers (`isOwner`, `isAdmin`, ...)  |
| `config/configuration.json` | Runtime settings (bot, telegram, security, limits, ...) |
| `config/permissions.js` | Role names → numeric levels                |
| `.env.example`        | Environment template                         |

## configuration.json sections

- `bot` — name, prefixes, groupPrefix, sessionPrefix, maintenance.
- `telegram` — token/admins, pairing toggle, dashboard.
- `whatsapp` — reconnect, pairing code, QR, cleanup.
- `features` — command/plugin/event/security/scheduler toggles.
- `security` — per-module enable flags + actions.
- `limits`, `cooldowns`, `logging`, `database`, `performance`.
- `owner`, `admins`, `premium`, `blacklist`.

## Access in code

```js
// inside a command
ctx.config.isOwner(ctx.senderNumber)
ctx.config.telegram.allowPairing
ctx.config.security.antiLink.enabled
ctx.config.branding.officialBranding
```

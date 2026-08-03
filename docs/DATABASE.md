# Database

*Priest MD — Developed by Inkora Systems*

Priest MD uses **MongoDB** via Mongoose. The connection manager is `database/index.js` and
models live in `database/models/`.

## Models

| Model | Purpose |
|-------|---------|
| `User` | Users (level, XP, coins, premium, roles) |
| `Group` | Group settings & state |
| `Session` | Session metadata & status |
| `Warning` | Moderation warnings |
| `Economy` | Wallets & transactions |
| `Security` | Security runtime state |
| `Permission` | Runtime permission grants |
| `Statistic` | Usage/performance counters |
| `Cooldown` | Persisted cooldowns (TTL auto-expire) |
| `Log` | Command/telegram/security logs |
| `Configuration` | Runtime key/value config |
| `Premium` | Premium entitlements |
| `Plugin` | Plugin registry |
| `AuditLog` | Security audit trail |
| `PairingRequest` | Pairing lifecycle |
| `Reminder` | Scheduled reminders |

## Accessing models

```js
// in a command / plugin
const models = require('../../database/models');
await models.Group.findOne({ jid: ctx.jid });
```

`ctx.db` is also exposed on every command context.

## Connection & degraded mode

- `database.connect(uri)` connects and registers all models.
- If MongoDB is unavailable, the framework runs in **degraded mode**: DB operations fail
  fast (no buffering) and are caught, so the bot keeps running.
- `mongoose.set('bufferCommands', false)` prevents operations from hanging when offline.

## Migrations

`database/migrations/` holds schema migrations. Each file exports `up(db, models)` and
`down(db, models)`. They run automatically at startup and are tracked in the `_migrations`
collection.

## Cache

`shared/cache` provides an in-memory TTL cache to minimise DB queries for hot data
(configured via `config.performance`).

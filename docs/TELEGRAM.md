# Telegram Control Panel

*Priest MD — Developed by Inkora Systems*

Telegram is the **remote control panel**. It does not operate as a chat bot — it manages
the WhatsApp sessions.

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome & overview |
| `/help`  | List all commands |
| `/pair`  | Start pairing a WhatsApp number |
| `/status`| System health (sessions, MongoDB, uptime, RAM) |
| `/sessions` | Live session dashboard with inline controls |
| `/restart <num>` | Restart a session without re-pairing |
| `/update` | Version check |
| `/logs`   | Recent application logs |
| `/plugins`| Loaded plugins |
| `/settings` | Current settings summary |
| `/backup` | Create a tar.gz backup |
| `/restore`| Restore from a backup |
| `/shutdown` | Graceful shutdown |
| `/menu`   | Interactive inline menu |
| `/about`  | Framework info |
| `/cancel` | Abort current operation |

## Access control

Only users in `TELEGRAM_ADMINS` / `OWNERS` (see `config/configuration.json` and `.env`)
may control the bot. This is enforced by `services/telegram/middleware/auth.js`. A rate
limiter also guards against spam.

## Inline dashboard

`/sessions` renders a dashboard with per-session **Restart** buttons plus **Pair New** and
**Refresh**. Routing lives in `services/telegram/callbacks/index.js`.

## Layout

- `services/telegram/index.js` — `TelegramBot` class.
- `services/telegram/commands/` — one file per `/command`.
- `services/telegram/callbacks/` — inline callback router.
- `services/telegram/pairing/` — pairing flow.
- `services/telegram/dashboard/` — dashboard renderer.
- `services/telegram/middleware/` — auth + rate limit.
- `services/telegram/plugins/` — add control-panel commands without editing core.

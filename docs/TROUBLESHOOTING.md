# Troubleshooting

*Priest MD — Developed by Inkora Systems*

## Common issues

**No banner / process exits immediately**
Check `node -v` (≥ 18). Check `logs/error.log` for a startup error.

**Telegram not responding**
Ensure `TELEGRAM_TOKEN` is set in `.env` and the bot was started. The startup log shows
`Telegram control panel online`.

**"Access denied" on Telegram**
Add your Telegram ID or `@username` to `TELEGRAM_ADMINS` (or `OWNERS`), then restart.

**Pairing code never appears**
- The number must be valid and in international format.
- Check `logs/info.log` for `[session:<number>]` lines.
- Some numbers/regions require a valid (SIM-active) number to pair.

**Session won't connect / stuck offline**
Delete `sessions/<number>/` and re-pair, or check the number is not logged out.

**MongoDB connection refused**
Start MongoDB locally or point `MONGODB_URI` at a live instance. The bot runs in degraded
mode without it (logs show `MongoDB unavailable`).

**Command does nothing**
- Confirm the message uses a configured prefix (`.env`/`configuration.json`).
- Check `blacklist.commands` in config.
- Check the command file is valid (see `docs/COMMANDS.md`).
- Look at `logs/error.log`.

**Missing command in `.help`**
Only non-owner/non-admin commands appear; check the file is a valid command module.

**Bot stays offline after restart**
Verify `sessions/<number>/creds.json` exists. If missing, re-pair.

## Logs

- `logs/info.log` — general activity, `[app]`, `[session:...]`, `[telegram]`.
- `logs/error.log` — errors.
- `logs/warn.log` — warnings & security.
- `/logs` (Telegram) shows recent log lines.

## Getting help

Include the relevant log lines and your configuration (minus secrets) when reporting an
issue.

*Priest MD — Developed by Inkora Systems*

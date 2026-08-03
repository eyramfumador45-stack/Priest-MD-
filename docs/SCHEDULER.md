# Scheduler

*Priest MD — Developed by Inkora Systems*

`scheduler/` runs periodic background jobs via `node-cron`. Jobs are isolated modules —
a failure in one never stops the others.

## Jobs

| Job | File | Schedule | Purpose |
|-----|------|----------|---------|
| Cleanup | `cleanup.js` | daily 04:00 | Removes stale sessions/logs, purges old DB records |
| Backups | `backups.js` | daily 03:00 | Creates automatic tar.gz backups, prunes old ones |
| Reminders | `reminders.js` | every minute | Dispatches due scheduled messages |

## Manager

`scheduler/index.js` registers and starts/stops all jobs:

```js
const scheduler = require('./scheduler');
scheduler.startScheduler();
scheduler.stopScheduler();
```

## Reminders

Reminders are stored in the `Reminder` model (`chatJid`, `sessionNumber`, `message`,
`sendAt`, optional `recurring`). The job finds due reminders and sends them through the
owning WhatsApp session (`sessionManager.get(number)`), marking them sent or rescheduling
recurring ones.

## Configuration

Enable/disable scheduling with `features.scheduler` in `config/configuration.json`.

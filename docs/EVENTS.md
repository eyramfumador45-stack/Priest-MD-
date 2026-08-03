# Events

*Priest MD — Developed by Inkora Systems*

The framework is event-driven. **Every event has its own handler file** under
`services/whatsapp/events/` — nothing is crammed into one file.

## Handlers

| File | Baileys event | Purpose |
|------|---------------|---------|
| `messages.js` | `messages.upsert` | Commands & message pipeline |
| `group-update.js` | `groups.update` | Subject/desc changes |
| `participants-update.js` | `group-participants.update` | Welcome/goodbye + security |
| `call.js` | `call` | Reject calls (anti-call) |
| `presence.js` | `presence.update` | Touch last-active |
| `poll.js` | `messages.update` (poll) | Poll votes |
| `reaction.js` | `messages.update` (reaction) | Reactions |
| `message-delete.js` | `messages.update` (delete) | Anti-delete |

> **Note:** the raw `connection.update` stream (connect/open/close, reconnects,
> session wipe) is owned by `services/whatsapp/connection.js`, not by an event
> handler — see `docs/WHATSAPP.md` → *Disconnect handling*.

## Handler signature

```js
module.exports = function myHandler(sock, session) {
  sock.ev.on('some.event', async (payload) => {
    // handle it; always try/catch
  });
};
```

## Adding an event

1. Create `services/whatsapp/events/my-event.js`.
2. Export a function `(sock, session) => { ... }`.
3. Restart (or hot-reload). The loader `services/whatsapp/events/index.js` auto-attaches it.

Each handler is isolated — a failure in one never affects the others. Any event handler
can `session.emit(...)` to raise a custom event consumed elsewhere (e.g. security
scanners listen to `participants-change`).

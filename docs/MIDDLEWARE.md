# Middleware

*Priest MD — Developed by Inkora Systems*

Middleware runs **before** a WhatsApp command executes. Each middleware is an independent
module under `services/whatsapp/middleware/`.

## Default chain

`maintenance → blacklist → rate-limiter → logging → permissions → cooldown`

- **maintenance** — blocks everyone except owners while maintenance mode is on.
- **blacklist** — blocks blacklisted users/groups.
- **rate-limiter** — sliding-window command flood protection.
- **logging** — logs command usage (console + `Log` model).
- **permissions** — enforces `owner/admin/premium/group/onlyGroup/private` + permission levels.
- **cooldown** — per-command cooldown.

## Writing middleware

```js
// services/whatsapp/middleware/my-thing.js
module.exports = function myThing(deps) {
  return async function myThing(ctx, next) {
    if (shouldBlock) {
      ctx._handled = true;                     // short-circuit the chain
      await ctx.reply({ text: 'Blocked.' });
      return;
    }
    return next();                              // continue
  };
};
```

## Pipeline

`services/whatsapp/middleware/index.js` composes middleware with `compose([...])` and
`defaultPipeline(deps)` builds the default ordered chain used by `message-handler.js`.

Rules:

- Set `ctx._handled = true` to stop further processing.
- Always `return next()` (or short-circuit) — don't leave the chain dangling.
- Middleware never needs to be awaited individually; the pipeline handles ordering.

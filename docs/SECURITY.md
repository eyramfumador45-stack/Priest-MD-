# Security Framework

*Priest MD — Developed by Inkora Systems*

`services/whatsapp/security/` contains **independent, independently-configurable**
security modules. Each module can be enabled/disabled and given its own **action**
(`warn`, `kick`, `mute`, `log`) via `config/configuration.json`.

## Modules

| Module | Trigger | Default action |
|--------|---------|----------------|
| `anti-hijack` | group setting burst | log/kick |
| `anti-raid`   | flood of joins | mute |
| `anti-spam`   | message flooding | warn |
| `anti-flood`  | rapid messages | mute |
| `anti-bot`    | bot-like behaviour | kick |
| `anti-link`   | links / invites | warn |
| `anti-mention`| mass @-mentions | warn |
| `anti-nuke`   | mass removal | mute |
| `anti-abuse`  | abusive language | warn |
| `anti-fake`   | invalid numbers | kick |
| `anti-foreign`| non-allow-listed countries | kick |
| `captcha`     | new-member math captcha | kick |
| `verification`| verification framework | - |
| `anti-call`   | (in call.js) rejects calls | reject |
| `anti-delete` | (in message-delete.js) re-posts deletes | log |

## Module interface

```js
module.exports = {
  name: 'anti-spam',
  enabled: () => config.security?.antiSpam?.enabled === true,
  async onMessage(ctx, session) { /* return true if acted */ },
  async onParticipants(payload, session) { /* joins/removals */ },
  async onGroupUpdate(sock, session, update) { /* group changes */ },
};
```

## The SecurityManager

`services/whatsapp/security/index.js` loads all enabled modules, runs them against
messages (`scanMessage`) and participant events (`scanParticipants`), and applies actions
via `act(action, ctx, targetJid, reason)`. Each module is try/caught, so one failure never
breaks the others.

## Config example

```json
"security": {
  "antiLink": { "enabled": true, "action": "warn" },
  "antiRaid": { "enabled": true, "windowMs": 60000, "threshold": 10, "action": "mute" }
}
```

All security actions write to the `AuditLog` model.

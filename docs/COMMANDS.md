# Commands

*Priest MD — Developed by Inkora Systems*

WhatsApp commands are auto-discovered from `services/whatsapp/commands/` (recursively,
including subfolders like `owner/`, `admin/`, `fun/`, ...). **No manual registration** is
needed — just drop a valid module into the tree.

## Command module contract

```js
module.exports = {
  name: 'ping',
  description: 'Check latency',
  aliases: ['p'],
  category: 'utility',
  usage: '.ping',
  permissions: [],
  cooldown: 5000,
  owner: false,
  admin: false,
  group: false,
  onlyGroup: false,
  private: false,
  premium: false,
  execute: async (ctx) => {
    await ctx.reply({ text: 'Pong!' });
  },
};
```

## Metadata

| Field | Type | Meaning |
|-------|------|---------|
| `name` | string | unique name |
| `description` | string | short help text |
| `aliases` | string[] | extra triggers |
| `category` | string | grouping in `.help` |
| `usage` | string | example |
| `permissions` | string[] | required roles |
| `cooldown` | number | ms between uses |
| `owner` | boolean | owner-only |
| `admin` | boolean | framework-admin only |
| `group` | boolean | group-admin only (in groups) |
| `onlyGroup` | boolean | only in groups |
| `private` | boolean | only in private chat |
| `premium` | boolean | premium-only |

## The `ctx` object

- `ctx.sock`, `ctx.msg`, `ctx.session`
- `ctx.jid` (chat), `ctx.sender` (participant), `ctx.isGroup`
- `ctx.senderNumber`, `ctx.text`
- `ctx.prefix`, `ctx.commandName`, `ctx.args`, `ctx.argList`
- `ctx.reply(content)`, `ctx.send(jid, content)`, `ctx.react(emoji)`
- `ctx.db` (models), `ctx.config`, `ctx.constants`, `ctx.helpers`, `ctx.utils`, `ctx.logger`
- `ctx.getGroupMetadata()`

## Registry API (`services/whatsapp/commands/index.js`)

```js
const registry = require('./services/whatsapp/commands');
registry.list();                 // all commands
registry.get('ping');            // by name or alias
registry.has('p');
registry.byCategory('fun');
registry.reload('ping');         // hot reload
registry.loadAll();
```

## Validation

The loader validates that `name` is a non-empty string and `execute` is a function.
Invalid modules are skipped with a warning (they never crash the framework). `index.js`
is excluded from auto-loading.

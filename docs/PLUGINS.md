# Plugins

*Priest MD — Developed by Inkora Systems*

Plugins let you extend Priest MD **without editing core code**. Drop a file into the
plugin directory and it auto-loads.

## WhatsApp plugins — `services/whatsapp/plugins/`

```js
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'What it does',
  author: 'Inkora Systems',
  install(api) {
    api.registerCommand({
      name: 'hello',
      description: 'Says hello',
      category: 'fun',
      usage: '.hello',
      execute: async (ctx) => ctx.reply({ text: '👋 Hello!' }),
    });

    api.registerCommands([ /* more commands */ ]);
  },
};
```

The `api` object exposes: `registerCommand`, `registerCommands`, `config`, `db`,
`helpers`, `utils`, `logger`.

## Telegram plugins — `services/telegram/plugins/`

```js
module.exports = {
  name: 'tg-plugin',
  install(api) {
    api.command('ping', async (ctx) => ctx.reply('🏓 Pong!'));
  },
};
```

The `api` object exposes: `command(name, handler)`, `config`, `logger`.

## How loading works

- `services/whatsapp/plugins/index.js` scans `plugins/`, loads each module, calls
  `install(api)`, and registers any commands into the shared command registry.
- `services/telegram/plugins/index.js` does the same for the control panel.
- A plugin missing `install()` is skipped with a warning.
- One failing plugin does not stop the others (each is try/caught).

## Plugin registry

The `Plugin` model in MongoDB tracks plugin metadata; `/plugins` (Telegram) and the
`.plugins` command (WhatsApp, owner) list loaded plugins.

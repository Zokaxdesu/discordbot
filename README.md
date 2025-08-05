# 🎉 Discord Bot

A **modular**, **extensible** Discord bot built with `discord.js` v14. This bot architecture features:

* **Plugin-based features**: add new commands/events without touching core code.
* **Automatic slash-command deployment**: updates guild commands on startup.
* **Structured logging**: Winston with timestamped, level-based output to console and optional files.
* **Global cooldowns**: per-command, per-user rate limiting.
* **Automated tests**: Jest ensures core loading logic runs without side effects.

---

## 🚀 Quick Start Guide

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd discordbot
```

### 2. Install Dependencies

```bash
npm install
```

This will install:

* `discord.js@14` – the Discord API library
* `winston` – for structured logging
* `jest` – for testing
* plus other utilities in `package.json`.

### 3. Configure Environment Variables

Create a `.env` file in the project root with:

```ini
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_APPLICATION_ID
GUILD_ID=YOUR_GUILD_ID
LOG_LEVEL=info        # set to debug|warn|error for verbosity
```

> **Note:** Keep `.env` out of version control. Your token is sensitive!

### 4. Run Tests

```bash
npm test
```

* Jest will import `index.js` without starting the bot (thanks to `require.main === module`).
* Ensures `loadFeatures()` correctly registers core plugins.

### 5. Start the Bot

**Locally**:

```bash
node index.js
```

**With PM2 (recommended for production)**:

```bash
pm install -g pm2
pm start         # or pm2 start index.js --name discordbot
pm2 logs discordbot
```

---

## 📂 Detailed Project Structure

```text
.
├── console_files.txt          # Files using raw console calls (pre-logger)
├── data/                      # Static JSON data (e.g. channel_categories)
├── features/                  # Modular plugin features
│   ├── core/                  # Core loader, interaction handler, logger
│   │   ├── index.js           # Registers event handler and init logic
│   │   └── logger.js          # Winston setup (console + file transports)
│   ├── feature-template/      # Boilerplate for new features
│   ├── fun/                   # Example fun commands (irl, pornpics, r34)
│   ├── moderation/            # Moderate commands (ban, kick, purge)
│   └── utility/               # Utility commands (agegate, delcat, ecn, exportchannelnames, exportserver, ping)
├── handlers/                  # Legacy handler code (deprecated)
├── index.js                   # Entry point: imports logger, defines client, loadFeatures, init
├── jest.config.js             # Jest configuration for testing environment
├── logs/                      # Generated log files (if file transport enabled)
├── node_modules/              # Installed npm packages
├── package.json               # Project metadata & scripts
├── package-lock.json
├── pornpics_search.py         # Python helper scripts (external API wrappers)
├── redgifs_search.py
└── tests/                     # Jest test suites
    └── loadFeatures.test.js   # Validates plugin loading without side effects
```

---

## 🛠️ Core Components Explained

### 1. **`index.js`** (Entry Point)

* **Imports** Winston logger from `features/core/logger.js`.
* **Initializes** `Client` with necessary intents & partials.
* **Sets up** `client.commands` and `client.cooldowns` collections.
* **Defines** `loadFeatures(client)`: dynamically loads each folder under `features/`, registers commands & events, and calls optional `init()` for each.
* **Auto-deploys** slash commands to Discord via REST.
* **Implements** `init()` guard (`require.main === module`) so tests can import `loadFeatures` without starting the bot.

### 2. **`features/core/logger.js`**

```js
const { createLogger, format, transports } = require('winston');

module.exports = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) =>
      `${timestamp} ${level}: ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
    )
  ),
  transports: [
    new transports.Console(),
    // new transports.File({ filename: 'bot.log' })
  ]
});
```

* **Colorized**, **timestamped**, and prints extra metadata when provided.
* Add `File` transport for persistent logs.

### 3. **`features/core/index.js`** (Interaction Handler)

* Listens to `interactionCreate`.
* **Cooldown logic**: checks `client.cooldowns` map before executing commands. Replies with ephemeral message if user must wait. Default 3s per command, configurable via `cmd.cooldown`.
* **Dispatch**: calls `cmd.execute(interaction, client)` or `cmd.execute(interaction)` based on function arity.
* **Error handling**: catches exceptions and replies with an error message.

---

## ✨ Adding New Features

1. **Copy** `features/feature-template/` to `features/<your-feature>/`.
2. In `index.js` of your feature, export:

   ```js
   module.exports = {
     name: 'your-feature',
     commands: [ /* require your command modules */ ],
     events: [ /* optionally require event modules */ ],
     init(client) { /* optional startup code */ }
   };
   ```
3. **Write** commands under `commands/` using Discord.js `SlashCommandBuilder`:

   ```js
   module.exports = {
     data: new SlashCommandBuilder()
       .setName('ping')
       .setDescription('Replies with Pong!'),
     cooldown: 5,      // optional: override default cooldown
     async execute(interaction) {
       await interaction.reply('🏓 Pong!');
     }
   };
   ```
4. Restart the bot—your new slash command is automatically deployed and ready.

---

## ✅ Testing with Jest

* **Configuration** in `jest.config.js` points to `tests/` directory.
* **loadFeatures.test.js** asserts that core and template features register commands without side effects or network calls.
* **Run**:

  ```bash
  npm test
  ```
* **Detect leaks**:

  ```bash
  npm test -- --detectOpenHandles
  ```

---

## 📈 Monitoring & Next Steps

* **Persistent storage**: integrate SQLite or MongoDB for user data, settings, and more complex features.
* **External logs**: enable file transport, or pipe logs to Papertrail, Loggly, or ELK.
* **CI/CD**: add GitHub Actions to run tests and lint on each PR.
* **Advanced features**: polls, leveling, welcome messages, dashboards.

---

Happy coding and enjoy extending your bot! 🚀

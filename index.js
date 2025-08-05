// index.js
const logger = require('./features/core/logger');
const { Client, GatewayIntentBits, Collection, Partials, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Validate required environment variables early
const REQUIRED_ENV = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const envVar of REQUIRED_ENV) {
  if (!process.env[envVar]) {
    logger.error('? Missing required environment variable:', envVar);
    process.exit(1);
  }
}

// Create the Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

logger.info('?? Collections initialized');

/**
 * Load all features (self-contained plugins) from /features
 */
async function loadFeatures(client) {
  const featuresDir = path.join(__dirname, 'features');
  for (const item of fs.readdirSync(featuresDir)) {
    const featurePath = path.join(featuresDir, item);
    if (!fs.lstatSync(featurePath).isDirectory()) continue;

    const feature = require(featurePath);

    // Register commands
    if (Array.isArray(feature.commands)) {
      for (const cmd of feature.commands) {
        client.commands.set(cmd.data.name, cmd);
        logger.info(`?? [${feature.name}] loaded command: ${cmd.data.name}`);
      }
    }

    // Register events
    if (Array.isArray(feature.events)) {
      for (const ev of feature.events) {
        const listener = (...args) => ev.execute(...args, client);
        if (ev.once) client.once(ev.name, listener);
        else          client.on(ev.name, listener);
        logger.info(`?? [${feature.name}] loaded event:   ${ev.name}`);
      }
    }

    // Run initialization logic
    if (typeof feature.init === 'function') {
      feature.init(client);
    }
  }
}

// Initialization and deployment
async function init() {
  try {
    await loadFeatures(client);
    logger.info('? Features loaded:', [...client.commands.keys()]);

    // Auto-deploy slash commands
    const allCommands = [...client.commands.values()].map(cmd => cmd.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    logger.info(`?? Deploying ${allCommands.length} commands to guild ${process.env.GUILD_ID}...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: allCommands }
    );
    logger.info(`? Successfully deployed ${allCommands.length} commands.`);

    // Login and guild info
    logger.info('?? Logging in to Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    logger.info(`?? Logged in as ${client.user.tag}`);

    logger.info(`?? env.GUILD_ID = ${process.env.GUILD_ID}`);
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    logger.info(`? Connected to guild: ${guild.name} (${guild.id})`);

    const commands = await guild.commands.fetch();
    logger.info(`?? Guild commands registered: ${commands.size}`);
  } catch (error) {
    logger.error('? Fatal initialization error:', error);
    process.exit(1);
  }
}

// Global error handling
process.on('unhandledRejection', error => {
  logger.error('? Unhandled rejection:', error);
});

process.on('uncaughtException', error => {
  logger.error('? Uncaught exception:', error);
});

// Only auto-run init if this file is the entry point
if (require.main === module) {
  init()
    .then(() => {
      logger.info('?? Bot is fully operational');
    })
    .catch(error => {
      logger.error('? Critical startup failure:', error);
      process.exit(1);
    });
}

module.exports = { client, loadFeatures };

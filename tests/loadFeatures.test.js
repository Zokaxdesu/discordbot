// tests/loadFeatures.test.js
const path = require('path');
const { Client, Collection } = require('discord.js');

// Import the loader function
const { loadFeatures } = require('../index.js');  // we’ll expose it

describe('loadFeatures()', () => {
  let client;

  beforeEach(() => {
    client = new Client({ intents: [], partials: [] });
    client.commands = new Collection();
    client.cooldowns = new Collection();
  });

  test('loads at least the core and feature-template', async () => {
    await loadFeatures(client);
    // feature-template has no commands, but core registers no commands
    expect(client.commands instanceof Collection).toBe(true);
    // expect that one of your known commands (e.g. 'ping') is loaded
    expect(client.commands.has('ping')).toBe(true);
  });
});

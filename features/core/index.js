const logger = require('./logger');
// features/core/index.js

module.exports = {
  name: 'core',
  commands: [],

  events: [
    {
      name: 'interactionCreate',
      once: false,

      /**
       * @param {import('discord.js').Interaction} interaction
       * @param {import('discord.js').Client} client
       */
      async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const commandName = interaction.commandName;
        const cmd = client.commands.get(commandName);
        if (!cmd) return;

        // —— GLOBAL COOLDOWN LOGIC ——
        const now = Date.now();
        const cooldownSec = cmd.cooldown ?? 3;         // default 3s if not set on command
        if (!client.cooldowns.has(commandName)) {
          client.cooldowns.set(commandName, new Map());
        }
        const timestamps = client.cooldowns.get(commandName);
        const expiresAt = (timestamps.get(interaction.user.id) || 0) + cooldownSec * 1000;

        if (now < expiresAt) {
          const timeLeft = ((expiresAt - now) / 1000).toFixed(1);
          return interaction.reply({
            content: `? Please wait ${timeLeft}s before reusing \`/${commandName}\`.`,
            ephemeral: true
          });
        }

        // Record usage and schedule cleanup
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownSec * 1000);

        // —— END COOLDOWN LOGIC ——

        try {
          // Dispatch to command (arity-aware)
          const arity = cmd.execute.length;
          if (arity === 2) {
            await cmd.execute(interaction, client);
          } else {
            await cmd.execute(interaction);
          }
        } catch (err) {
          logger.error(`? Error in /${commandName}:`, err);
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: '? Command error', ephemeral: true });
          } else {
            await interaction.reply({ content: '? Command error', ephemeral: true });
          }
        }
      }
    }
  ],

  init(client) {
    logger.info(`?? [core] event handlers registered.`);
  }
};

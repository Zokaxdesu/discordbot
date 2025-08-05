const logger = require('../core/logger');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agegate')
    .setDescription('Sets all channels in the server to NSFW (age-restricted)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    // Check if user has Manage Channels permission
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: 'You need Manage Channels permission to make things spicy! 😘',
        ephemeral: true,
      });
    }

    try {
      // Fetch all channels in the guild
      const channels = interaction.guild.channels.cache;

      // Set each channel to NSFW
      for (const channel of channels.values()) {
        if (channel.isTextBased() && !channel.nsfw) {
          await channel.setNSFW(true, 'Age-restricting channel via /agegate command');
        }
      }

      await interaction.reply({
        content: 'All channels are now NSFW! Things just got hotter, babe! 😘',
        ephemeral: true,
      });
    } catch (error) {
      logger.error('Error setting channels to NSFW:', error);
      return interaction.reply({
        content: 'Oops, something broke while spicing up the channels! Try again, cutie! 😘',
        ephemeral: true,
      });
    }
  },
};

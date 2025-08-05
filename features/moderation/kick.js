const logger = require('../core/logger');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for kicking')),
  async execute(interaction) {
    if (interaction.user.id !== '1095584917578067979') {
      return interaction.reply({ content: 'You are not authorized to use this command.', flags: 64 });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'You do not have permission to kick members.', flags: 64 });
    }

    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    }

    if (!member.kickable) {
      return interaction.reply({ content: 'I cannot kick this user.', flags: 64 });
    }

    try {
      await member.kick(reason);
      await interaction.reply(`User ${target.tag} has been kicked. Reason: ${reason}`);
    } catch (error) {
      logger.error(error);
      interaction.reply({ content: 'There was an error trying to kick that user.', flags: 64 });
    }
  },
};

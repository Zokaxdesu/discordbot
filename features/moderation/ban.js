const logger = require('../core/logger');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for banning')),
  async execute(interaction) {
    if (interaction.user.id !== '1095584917578067979') {
      return interaction.reply({ content: 'You are not authorized to use this command.', flags: 64 });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'You do not have permission to ban members.', flags: 64 });
    }

    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    }

    if (!member.bannable) {
      return interaction.reply({ content: 'I cannot ban this user.', flags: 64 });
    }

    try {
      await member.ban({ reason });
      await interaction.reply(`User ${target.tag} has been banned. Reason: ${reason}`);
    } catch (error) {
      logger.error(error);
      interaction.reply({ content: 'There was an error trying to ban that user.', flags: 64 });
    }
  },
};

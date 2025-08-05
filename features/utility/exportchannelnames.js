const logger = require('../core/logger');
const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ecn')
    .setDescription('Export channel names in a category to logs/<category>.json')
    .addStringOption(option =>
      option
        .setName('categoryid')
        .setDescription('The ID of the category to export')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64});
    try {
      const categoryId = interaction.options.getString('categoryid');
      const guild = interaction.guild;
      if (!guild) {
        return interaction.editReply('This command must be used in a server.');
      }

      const category = guild.channels.cache.get(categoryId);
      if (!category || category.type !== ChannelType.GuildCategory) {
        return interaction.editReply('Invalid category ID provided.');
      }

      // Gather child channels
      const children = guild.channels.cache
        .filter(ch => ch.parentId === categoryId && ch.type === ChannelType.GuildText)
        .sort((a, b) => a.position - b.position);

      const exportData = {
        category: {
          id: category.id,
          name: category.name
        },
        channels: children.map(ch => ({ id: ch.id, name: ch.name }))
      };

      // Ensure logs directory
      const logsDir = path.resolve(__dirname, '../../logs');


      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const filename = `category_${category.id}_${Date.now()}.json`;
      const filepath = path.join(logsDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf8');
      logger.info(`Saved export to: ${filepath}`);

      await interaction.editReply(
        `? Exported **${category.name}** with ${children.size} channel(s) to \`logs/${filename}\`.`
      );
    } catch (error) {
      logger.error('Error in /ecn:', error);
      await interaction.editReply('? Failed to export channels: ' + error.message);
    }
  }
};

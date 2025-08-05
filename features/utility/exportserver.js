const logger = require('../core/logger');
const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('exportserver')
    .setDescription('Exports complete server structure to JSON')
    .setDefaultMemberPermissions(0) // Admin-only
    .setDMPermission(false),

  async execute(interaction) {
    // Critical: Immediate response
    await interaction.deferReply({ flags: 64});
    
    try {
      const { guild } = interaction;
      const startTime = Date.now();

      // Initial processing message
      await interaction.editReply('?? Beginning server scan...');

      // 1. Collect server metadata
      const exportData = {
        meta: {
          name: guild.name,
          id: guild.id,
          created: guild.createdAt.toISOString(),
          members: guild.memberCount,
          icon: guild.iconURL(),
          channels: guild.channels.cache.size,
          roles: guild.roles.cache.size
        },
        categories: []
      };

      // 2. Process categories with progress updates
      const categories = guild.channels.cache
        .filter(c => c.type === ChannelType.GuildCategory)
        .sort((a, b) => a.position - b.position);

      for (const [index, category] of categories.entries()) {
        // Update progress every 2 categories
        if (index % 2 === 0) {
          await interaction.editReply(
            `?? Processing category ${index + 1}/${categories.size}...`
          );
        }

        const categoryData = {
          name: category.name,
          id: category.id,
          position: category.position,
          channels: []
        };

        // Process channels in category
        category.children.cache
          .sort((a, b) => a.position - b.position)
          .forEach(channel => {
            categoryData.channels.push({
              name: channel.name,
              id: channel.id,
              type: ChannelType[channel.type],
              position: channel.position,
              nsfw: channel.nsfw,
              topic: channel.topic,
              rateLimit: channel.rateLimitPerUser
            });
          });

        exportData.categories.push(categoryData);
      }

      // 3. Save to file
      await interaction.editReply('?? Saving data...');
      
      const logsDir = path.join(__dirname, '../logs');
      await fs.mkdir(logsDir).catch(() => {}); // Ignore if exists
      
      const filename = `server_${guild.id}_${Date.now()}.json`;
      const filePath = path.join(logsDir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));

      // Final success message
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      await interaction.editReply({
        content: `? Exported ${exportData.categories.length} categories with ` +
                `${exportData.meta.channels} channels in ${duration}s\n` +
                `?? Location: \`logs/${filename}\``,
        ephemeral: true
      });

    } catch (error) {
      logger.error('Export Error:', error);
      await interaction.editReply({
        content: `? Export failed: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
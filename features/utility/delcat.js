const logger = require('../core/logger');
const { SlashCommandBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delcat')
    .setDescription('Delete a category and all its channels after confirmation')
    .addStringOption(option =>
      option
        .setName('categoryid')
        .setDescription('The ID of the category to delete')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    const categoryId = interaction.options.getString('categoryid');
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: 'This command must be used in a server.', flags: 64});
    }

    const category = guild.channels.cache.get(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return interaction.reply({ content: 'Invalid category ID provided.', flags: 64});
    }

    const children = guild.channels.cache.filter(ch => ch.parentId === categoryId);
    const count = children.size;

    // Ask for confirmation
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_delete')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_delete')
        .setLabel('No')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: `Are you sure you want to delete category **${category.name}** and its ${count} channel(s)?`,
      components: [row],
      ephemeral: true
    });

    // Create a collector for the response
    const filter = i => ['confirm_delete', 'cancel_delete'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 15000
    });

    collector.on('collect', async i => {
      await i.deferUpdate();
      if (i.customId === 'confirm_delete') {
        // Delete all child channels
        for (const ch of children.values()) {
          await ch.delete().catch(console.error);
        }
        // Delete the category itself
        await category.delete().catch(console.error);
        await interaction.editReply({ content: `? Deleted category **${category.name}** and its ${count} channel(s).`, components: [] });
      } else {
        await interaction.editReply({ content: '? Deletion canceled.', components: [] });
      }
      collector.stop();
    });

    collector.on('end', collected => {
      if (!collected.size) {
        interaction.editReply({ content: '? No response, deletion canceled.', components: [] });
      }
    });
  }
};

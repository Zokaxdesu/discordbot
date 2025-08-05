const logger = require('../core/logger');
const { SlashCommandBuilder, ChannelType } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('r34')
    .setDescription('Fetches spicy Rule 34 content based on a tag')
    .addStringOption(option =>
      option
        .setName('tag')
        .setDescription('The tag to search for (e.g., ahegao, artistName)')
        .setRequired(true)
	
    ),
cooldown: 5,

  async execute(interaction) {
    // Check if command is used in NSFW channel
    if (interaction.channel.type !== ChannelType.GuildText || !interaction.channel.nsfw) {
      return interaction.reply({
        content: '?? This command can only be used in NSFW channels, cutie.',
        ephemeral: true,
      });
    }

    const tagInput = interaction.options.getString('tag');
    // sanitize input: lowercase, replace spaces with underscore, remove invalid chars
    const tag = tagInput.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    try {
      const response = await axios.get('https://api.rule34.xxx/index.php', {
        params: {
          page: 'dapi',
          s: 'post',
          q: 'index',
          json: 1,
          limit: 100,
          tags: tag,
        },
        headers: {
          'User-Agent': 'DiscordBot (r34bot/1.0)',
        },
      });

      const posts = response.data;

      if (!posts || posts.length === 0) {
        return interaction.reply({
          content: `Couldn't find anything for **${tagInput}**. Try another tag, honey`,
          ephemeral: true,
        });
      }

      const post = posts[Math.floor(Math.random() * posts.length)];
      const fileUrl = post.file_url || post.sample_url || post.preview_url;

      // Reply with two messages: first spicy text, then URL alone for embed
      await interaction.reply({
        content: `Here's something filthy for **${tagInput}**`,
      });
      await interaction.followUp(fileUrl);

    } catch (error) {
      logger.error('Error fetching Rule34 content:', error);
      return interaction.reply({
        content: `Ugh, something broke while fetching that filth... Try again later, babe`,
        ephemeral: true,
      });
    }
  },
};

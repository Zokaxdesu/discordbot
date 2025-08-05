const logger = require('../core/logger');
const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pornpics')
    .setDescription('Get a random PornPics image by tag.')
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('Enter a tag (e.g. blonde, milf, fingering)')
        .setRequired(true)
    ),
cooldown: 5,

  async execute(interaction) {
    const tag = interaction.options.getString('tag').toLowerCase();
    const apikey = process.env.ADULTDATALINK_KEY;

    const url = `https://api.adultdatalink.com/pornpics/tag-image-links`;

    await interaction.deferReply(); // optional if it takes a moment

    try {
      const response = await axios.get(url, {
        params: { tag },
        headers: { Authorization: `Bearer ${apikey}` }
      });

      const linkList = response.data.urls?.link_list;
      if (!linkList || linkList.length === 0) {
        return interaction.editReply(`? No images found for tag **${tag}**.`);
      }

      const images = linkList.map(item => item.image_url).filter(Boolean);
      if (images.length === 0) {
        return interaction.editReply(`? No valid images found.`);
      }

      const chosenImage = images[Math.floor(Math.random() * images.length)];
      logger.info('Selected image URL:', chosenImage);

      // Download image
      const imagePath = path.join(__dirname, `../../temp_${Date.now()}.jpg`);
      const writer = fs.createWriteStream(imagePath);

      const imageResponse = await axios({
        url: chosenImage,
        method: 'GET',
        responseType: 'stream',
      });

      await new Promise((resolve, reject) => {
        imageResponse.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Send image as attachment
      await interaction.editReply({
        files: [imagePath],
      });
      
      logger.info('Deleting image file at path:', imagePath);

      // Clean up
      fs.unlink(imagePath, err => {
        if (err) logger.error('Failed to delete image:', err);
      });

    } catch (error) {
      logger.error('PornPics command error:', error);
      return interaction.editReply('? Error retrieving or uploading image.');
    }
  },
};

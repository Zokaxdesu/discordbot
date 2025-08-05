const logger = require('../core/logger');
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { execFile } = require("child_process");
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("irl")
    .setDescription("Get real-life NSFW content")
    .addSubcommand(subcommand =>
      subcommand
        .setName("video")
        .setDescription("Get a random real-life NSFW video from RedGIFs")
        .addStringOption(option =>
          option
            .setName("tag")
            .setDescription("Category/tag to search for (e.g., milf, bj, cosplay, or 'top')")
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("image")
        .setDescription("Get a random PornPics image by tag.")
        .addStringOption(option =>
          option
            .setName("tag")
            .setDescription("Enter a tag (e.g. blonde, milf, fingering)")
            .setRequired(true)
        )
    ),
cooldown: 5,
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "video") {
      await interaction.deferReply();

      const inputTag = interaction.options.getString("tag") || "milf";
      const isTop = inputTag.toLowerCase() === "top";

      const pythonPath = "./.venv/bin/python";
      const scriptPath = "./redgifs_search.py";
      const args = isTop ? ["--top"] : [inputTag];

      execFile(pythonPath, [scriptPath, ...args], async (error, stdout, stderr) => {
        if (error) {
          logger.error("RedGIFs Error:", stderr || error.message);
          return interaction.editReply("? Failed to fetch content. Try again later.");
        }

        try {
          const urls = JSON.parse(stdout);
          if (urls.length === 0) {
            return interaction.editReply(`? No results found for **${inputTag}**.`);
          }

          const random = urls[Math.floor(Math.random() * urls.length)];
          const tagUsed = isTop ? "top trending tag" : inputTag;

          const embed = new EmbedBuilder()
            .setTitle(`Here's your ${tagUsed} video!`)
            .setDescription(`<@${interaction.user.id}>, enjoy~ ??`)
            .setColor(0xff69b4)
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
          await interaction.followUp(random);
        } catch (e) {
          logger.error("JSON Parse Error:", e.message);
          interaction.editReply("? Error parsing RedGIFs response.");
        }
      });

    } else if (subcommand === "image") {
      const tag = interaction.options.getString('tag').toLowerCase();
      const apikey = process.env.ADULTDATALINK_KEY;
      const url = `https://api.adultdatalink.com/pornpics/tag-image-links`;

      await interaction.deferReply();

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
    }
  }
};

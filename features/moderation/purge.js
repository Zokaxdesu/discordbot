const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages by a specific user in this channel.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose messages you want to delete')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('amount')
        .setDescription('Number of recent messages to search (1-100) or "all"')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (interaction.user.id !== '1095584917578067979') {
      return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('user');
    const amountOption = interaction.options.getString('amount').toLowerCase();

    let messagesToDelete = [];

    if (amountOption === 'all') {
      let lastId;
      let done = false;
      while (!done) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const messages = await interaction.channel.messages.fetch(options);
        if (messages.size === 0) break;

        const filtered = messages.filter(msg => msg.author.id === targetUser.id);
        messagesToDelete = messagesToDelete.concat(Array.from(filtered.values()));

        lastId = messages.last().id;
        if (messages.size < 100) done = true;
      }
    } else {
      const amount = parseInt(amountOption, 10);
      if (isNaN(amount) || amount < 1 || amount > 100) {
        return interaction.editReply({ content: 'Amount must be a number between 1 and 100, or "all".' });
      }

      const messages = await interaction.channel.messages.fetch({ limit: amount });
      messagesToDelete = Array.from(messages.filter(msg => msg.author.id === targetUser.id).values());
    }

    if (messagesToDelete.length === 0) {
      return interaction.editReply({ content: `No messages found from ${targetUser.tag} in the specified range.` });
    }

    const chunkSize = 100;
    for (let i = 0; i < messagesToDelete.length; i += chunkSize) {
      const chunk = messagesToDelete.slice(i, i + chunkSize);
      await interaction.channel.bulkDelete(chunk, true);
    }

    await interaction.editReply({ content: `? Deleted ${messagesToDelete.length} message(s) from ${targetUser.tag}.` });

    // Optionally delete the bot message after 5 seconds if desired:
    setTimeout(async () => {
      try {
        const fetched = await interaction.fetchReply();
        await fetched.delete();
      } catch (_) { /* ignore */ }
    }, 5000);
  }
};

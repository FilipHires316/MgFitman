const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Bot opusti voice channel'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'Nie som v ziadnom channeli.', ephemeral: true });

    queue.voice.leave();
    await interaction.reply('Odchadzam z channelu.');
  },
};

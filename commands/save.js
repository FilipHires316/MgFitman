const { SlashCommandBuilder } = require('discord.js');
const { addFavorite } = require('../utils/favorites');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('save')
    .setDescription('Ulozi aktualne hrajucu skladbu do obľúbených'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs[0]) {
      return interaction.reply({ content: 'Nic sa neprehrava.', ephemeral: true });
    }

    const song = queue.songs[0];
    const added = addFavorite(interaction.user.id, { name: song.name, url: song.url });

    if (!added) {
      return interaction.reply({ content: `**${song.name}** uz mas v oblubenych.`, ephemeral: true });
    }

    await interaction.reply({ content: `Ulozene do oblubenych: **${song.name}**`, ephemeral: true });
  },
};

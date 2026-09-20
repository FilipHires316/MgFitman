const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Zobrazi aktualnu frontu'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'Fronta je prazdna.', ephemeral: true });

    const list = queue.songs
      .map((song, i) => `${i === 0 ? 'Teraz hra' : i}. ${song.name} - ${song.formattedDuration}`)
      .slice(0, 15)
      .join('\n');

    await interaction.reply(list);
  },
};

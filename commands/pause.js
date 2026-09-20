const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pozastavi prehravanie'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'Nic sa neprehrava.', ephemeral: true });

    queue.pause();
    await interaction.reply('Pozastavene.');
  },
};

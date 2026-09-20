const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Pokracuje v prehravani'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'Nic sa neprehrava.', ephemeral: true });

    queue.resume();
    await interaction.reply('Pokracujem.');
  },
};

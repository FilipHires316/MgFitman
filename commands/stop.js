const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Zastavi prehravanie a vymaze frontu'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'Nic sa neprehrava.', ephemeral: true });

    queue.stop();
    await interaction.reply('Zastavene, fronta vymazana.');
  },
};

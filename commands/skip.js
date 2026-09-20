const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Preskoci aktualnu skladbu'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'Nic sa neprehrava.', ephemeral: true });

    await interaction.deferReply();

    // ak je to posledna skladba vo fronte, skip by hodil chybu -> radsej zastavime prehravanie
    if (queue.songs.length <= 1) {
      queue.stop();
      return interaction.editReply('Preskocene. Fronta je prazdna.');
    }

    try {
      const song = await queue.skip();
      await interaction.editReply(`Preskocene. Teraz hra: **${song.name}**`);
    } catch (err) {
      await interaction.editReply({ content: 'Nepodarilo sa preskocit skladbu.' });
    }
  },
};

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Zapne/vypne opakovanie skladby alebo celej fronty')
    .addStringOption(option =>
      option.setName('mod')
        .setDescription('Co opakovat')
        .setRequired(true)
        .addChoices(
          { name: 'skladba', value: 'song' },
          { name: 'fronta', value: 'queue' },
          { name: 'vypnut', value: 'off' },
        )),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'Nic sa neprehrava.', ephemeral: true });

    const mod = interaction.options.getString('mod');
    const modeMap = { off: 0, song: 1, queue: 2 };
    const labelMap = { off: 'Opakovanie vypnute.', song: 'Opakujem aktualnu skladbu.', queue: 'Opakujem celu frontu.' };

    queue.setRepeatMode(modeMap[mod]);
    await interaction.reply(labelMap[mod]);
  },
};

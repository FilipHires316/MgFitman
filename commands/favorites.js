const { SlashCommandBuilder } = require('discord.js');
const { getFavorites, removeFavorite } = require('../utils/favorites');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('favorites')
    .setDescription('Sprava oblubenych skladieb')
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Zobrazi tvoje oblubene skladby'))
    .addSubcommand(sub =>
      sub.setName('play')
        .setDescription('Prida oblubenu skladbu do fronty')
        .addIntegerOption(opt =>
          opt.setName('cislo').setDescription('Cislo skladby zo zoznamu').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Vymaze skladbu z oblubenych')
        .addIntegerOption(opt =>
          opt.setName('cislo').setDescription('Cislo skladby zo zoznamu').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const favorites = getFavorites(interaction.user.id);

    if (sub === 'list') {
      if (favorites.length === 0) {
        return interaction.reply({ content: 'Nemas ziadne oblubene skladby.', ephemeral: true });
      }
      const list = favorites.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
      return interaction.reply({ content: list, ephemeral: true });
    }

    const index = interaction.options.getInteger('cislo') - 1;

    if (sub === 'remove') {
      const removed = removeFavorite(interaction.user.id, index);
      if (!removed) {
        return interaction.reply({ content: 'Neplatne cislo.', ephemeral: true });
      }
      return interaction.reply({ content: `Vymazane z oblubenych: **${removed.name}**`, ephemeral: true });
    }

    if (sub === 'play') {
      const song = favorites[index];
      if (!song) {
        return interaction.reply({ content: 'Neplatne cislo.', ephemeral: true });
      }

      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        return interaction.reply({ content: 'Musis byt vo voice channeli.', ephemeral: true });
      }

      await interaction.deferReply();
      try {
        await interaction.client.distube.play(voiceChannel, song.url, {
          member: interaction.member,
          textChannel: interaction.channel,
        });
        await interaction.editReply(`Pridavam do fronty: **${song.name}**`);
      } catch (err) {
        console.error(err);
        await interaction.editReply('Nepodarilo sa prehrat skladbu.');
      }
    }
  },
};

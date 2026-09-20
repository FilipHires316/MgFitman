const { SlashCommandBuilder } = require('discord.js');
const { execFile } = require('child_process');
const util = require('util');
const soundBot = require('../soundBot');
const execFileAsync = util.promisify(execFile);

const PLAYLIST_LIMIT = 50; // ochrana pred nekonecnymi YouTube Mixami

async function searchYoutube(query) {
  const { stdout } = await execFileAsync('yt-dlp', [
    `ytsearch1:${query}`,
    '--print', 'webpage_url',
    '--no-warnings',
    '--skip-download',
  ]);
  const url = stdout.trim().split('\n')[0];
  if (!url) throw new Error('Nic sa nenaslo.');
  return url;
}

async function getPlaylistUrls(url) {
  const { stdout } = await execFileAsync('yt-dlp', [
    url,
    '--flat-playlist',
    '--yes-playlist',
    '--playlist-end', String(PLAYLIST_LIMIT),
    '--print', 'url',
    '--no-warnings',
    '--skip-download',
  ]);
  return stdout.trim().split('\n').filter(Boolean);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Prehra YouTube link, playlist/mix, alebo vyhlada text')
    .addStringOption(option =>
      option.setName('link')
        .setDescription('YouTube URL (aj playlist/mix) alebo nazov/text na vyhladanie')
        .setRequired(true)),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: 'Musis byt vo voice channeli.', ephemeral: true });
    }

    // Vrat kontrolu nad audio vystupom DisTube-u (soundBot ju mohol medzicasom drzat)
    soundBot.handoffToDistube(interaction.guild.id, interaction.client);

    const input = interaction.options.getString('link');
    const isUrl = /^https?:\/\//i.test(input);
    const isPlaylist = isUrl && /[?&]list=/.test(input);

    await interaction.deferReply();

    if (isPlaylist) {
      let urls;
      try {
        urls = await getPlaylistUrls(input);
      } catch (err) {
        console.error(err);
        return interaction.editReply('Nepodarilo sa nacitat playlist.');
      }

      if (urls.length === 0) {
        return interaction.editReply('Playlist je prazdny alebo sa nepodarilo nacitat.');
      }

      await interaction.editReply(`Nacitavam playlist (${urls.length} skladieb)...`);

      let added = 0;
      for (const songUrl of urls) {
        try {
          await interaction.client.distube.play(voiceChannel, songUrl, {
            member: interaction.member,
            textChannel: interaction.channel,
          });
          added++;
        } catch (err) {
          console.error(`Preskakujem skladbu (${songUrl}):`, err.message);
        }
      }

      return interaction.editReply(`Pridane do fronty: **${added}/${urls.length}** skladieb z playlistu.`);
    }

    let query = input;
    if (!isUrl) {
      try {
        query = await searchYoutube(input);
      } catch (err) {
        console.error(err);
        return interaction.editReply(`Nenasiel som nic pre: **${input}**`);
      }
    }

    try {
      await interaction.client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });
      await interaction.editReply(`Pridavam do fronty: **${input}**`);
    } catch (err) {
      console.error(err);
      await interaction.editReply('Nepodarilo sa prehrat link.');
    }
  },
};
const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  StreamType,
  VoiceConnectionStatus,
  AudioPlayerStatus,
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const googleTTS = require('google-tts-api');

// Prevedie mp3 buffer (z Google TTS) na surovy PCM stream cez ffmpeg, vhodny pre @discordjs/voice
function transcodeToPcm(buffer) {
  const ffmpeg = spawn(ffmpegPath, [
    '-i', 'pipe:0',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1',
  ]);
  ffmpeg.stdin.write(buffer);
  ffmpeg.stdin.end();
  ffmpeg.stderr.on('data', () => {}); // potlacenie ffmpeg logov
  return ffmpeg.stdout;
}

async function fetchAudioBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Prehra zoznam Google TTS URL (chunkov textu) postupne na danom playeri
async function playChunks(urls, player) {
  for (const { url } of urls) {
    const buffer = await fetchAudioBuffer(url);
    const pcmStream = transcodeToPcm(buffer);
    const resource = createAudioResource(pcmStream, { inputType: StreamType.Raw });
    player.play(resource);
    await new Promise((resolve, reject) => {
      player.once(AudioPlayerStatus.Idle, resolve);
      player.once('error', reject);
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('message')
    .setDescription('Precita text nahlas v voice channeli (Google Translate hlas)')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Text, ktory sa ma precitat')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('jazyk')
        .setDescription('Jazyk citania (default: slovencina)')
        .addChoices(
          { name: 'Slovencina', value: 'sk' },
          { name: 'Cestina', value: 'cs' },
          { name: 'Anglictina', value: 'en' },
        )),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: 'Musis byt vo voice channeli.', ephemeral: true });
    }

    const text = interaction.options.getString('text');
    const lang = interaction.options.getString('jazyk') || 'cs';

    await interaction.deferReply();

    let urls;
    try {
      urls = await googleTTS.getAllAudioUrls(text, { lang, slow: false, host: 'https://translate.google.com' });
    } catch (err) {
      console.error('TTS chyba:', err.message);
      return interaction.editReply('Nepodarilo sa pripravit text na precitanie.');
    }

    const distubeQueue = interaction.client.distube.getQueue(interaction.guildId);

    try {
      if (distubeQueue && distubeQueue.voice) {
        // Bot uz hra hudbu v kanali -> docasne pozastavi a pouzije ten isty connection
        const connection = distubeQueue.voice.connection;
        const musicPlayer = distubeQueue.voice.audioPlayer;
        const wasPlaying = distubeQueue.playing && !distubeQueue.paused;

        if (wasPlaying) distubeQueue.pause();

        const ttsPlayer = createAudioPlayer();
        connection.subscribe(ttsPlayer);

        await playChunks(urls, ttsPlayer);

        connection.subscribe(musicPlayer);
        if (wasPlaying) distubeQueue.resume();
      } else {
        // Bot nehra -> pripoji sa samostatne, precita, a odpoji sa
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          selfDeaf: true,
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

        const ttsPlayer = createAudioPlayer();
        connection.subscribe(ttsPlayer);

        await playChunks(urls, ttsPlayer);

        connection.destroy();
      }

      await interaction.editReply(`Precitane: **${text}**`);
    } catch (err) {
      console.error('TTS prehravanie zlyhalo:', err.message);
      await interaction.editReply('Nepodarilo sa precitat text.');
    }
  },
};
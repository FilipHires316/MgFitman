require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const soundBot = require('./soundBot');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.distube = new DisTube(client, {
  plugins: [new YtDlpPlugin()],
  emitNewSongOnly: true,
});

client.once('clientReady', () => {
  console.log(`Prihlaseny ako ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const reply = { content: 'Nastala chyba pri vykonavani prikazu.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.distube
  .on('playSong', (queue, song) => {
    queue.textChannel?.send(`Teraz hra: **${song.name}** (${song.formattedDuration})`);
  })
  .on('addSong', () => {})
  .on('error', (queue, error) => {
    const message = error?.message || (typeof error === 'string' ? error : 'Neznama chyba pri prehravani.');
    console.error('DisTube error:', message);
    queue?.textChannel?.send('Vyskytla sa chyba pri prehravani.').catch(() => {});
  })
  .on('finish', queue => {
    queue.textChannel?.send('Fronta dohrata.');
    soundBot.reclaimAfterQueueEnds(queue.voice?.channel, client);
  })
  .on('empty', queue => {
    queue.textChannel?.send('Voice channel je prazdny, odchadzam.');
    soundBot.reclaimAfterQueueEnds(queue.voice?.channel, client);
  });

soundBot.attach(client);

client.login(process.env.DISCORD_TOKEN);
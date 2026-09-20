const { createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

const SOUNDS_DIR = path.join(__dirname, 'sounds');
const MIN_INTERVAL = 30 * 1000;
const MAX_INTERVAL = 150 * 1000;

const active = new Map(); // guildId -> { player, timeoutId }

function getRandomSound() {
  const files = fs.readdirSync(SOUNDS_DIR).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
  if (files.length === 0) return null;
  return path.join(SOUNDS_DIR, files[Math.floor(Math.random() * files.length)]);
}

function cleanup(guildId) {
  const entry = active.get(guildId);
  if (!entry) return;
  if (entry.timeoutId) clearTimeout(entry.timeoutId);
  active.delete(guildId);
}

function scheduleNext(guildId, client) {
  const entry = active.get(guildId);
  if (!entry) return;

  const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
  entry.timeoutId = setTimeout(() => {
    const queue = client.distube.getQueue(guildId);
    const distubePlaying = queue && queue.playing && !queue.paused;

    if (!distubePlaying) {
      const voice = client.distube.voices.get(guildId);
      if (voice) {
        // preber spojenie spat pre nahodny zvuk (DisTube prave nic nehra)
        voice.connection.subscribe(entry.player);
        const sound = getRandomSound();
        if (sound) entry.player.play(createAudioResource(sound));
      }
    }
    scheduleNext(guildId, client);
  }, delay);
}

async function connectAndStart(channel, client) {
  const guildId = channel.guild.id;
  if (active.has(guildId)) return;

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
  });
  active.set(guildId, { player, timeoutId: null });

  // vytvori alebo znovupouzije spojenie SPRAVOVANE PRIAMO DisTube-om
  const voice = await client.distube.voices.join(channel);
  voice.connection.subscribe(player);

  scheduleNext(guildId, client);
}

function disconnectAndStop(guildId, client) {
  cleanup(guildId);
  client.distube.voices.leave(guildId);
}

// Volaj TESNE PRED client.distube.play(...) v /play — vrati DisTube-u
// kontrolu nad audio vystupom (soundBot ju mohol medzicasom drzat)
function handoffToDistube(guildId, client) {
  const entry = active.get(guildId);
  if (entry) entry.player.stop(); // cisto zastavi prehravajuci sa nahodny zvuk

  const voice = client.distube.voices.get(guildId);
  if (voice) voice.connection.subscribe(voice.audioPlayer);
}

// Volaj po 'finish'/'empty' evente DisTube fronty — soundBot sa
// znova ujme spojenia, ak su v kanali este ludia
function reclaimAfterQueueEnds(channel, client) {
  if (!channel) return;
  const guildId = channel.guild.id;
  const humanCount = channel.members.filter(m => !m.user.bot).size;

  if (humanCount === 0) {
    cleanup(guildId);
    client.distube.voices.leave(guildId);
    return;
  }

  const entry = active.get(guildId);
  if (entry) {
    const voice = client.distube.voices.get(guildId);
    if (voice) voice.connection.subscribe(entry.player);
  } else {
    connectAndStart(channel, client);
  }
}

function makeHandler(client) {
  return function handleVoiceStateUpdate(oldState, newState) {
    // ignoruj zmeny stavu samotneho bota (rieseneho pripojenim/odpojenim vyssie)
    if (newState.id === client.user.id || oldState.id === client.user.id) return;

    const channel = newState.channel || oldState.channel;
    if (!channel) return;

    const humanCount = channel.members.filter(m => !m.user.bot).size;
    const hasConnection = !!client.distube.voices.get(channel.guild.id);

    if (humanCount > 0 && !hasConnection) {
      connectAndStart(channel, client);
    }
    if (humanCount === 0 && hasConnection) {
      disconnectAndStop(channel.guild.id, client);
    }
  };
}

module.exports = {
  attach(client) {
    client.on('voiceStateUpdate', makeHandler(client));
  },
  handoffToDistube,
  reclaimAfterQueueEnds,
};
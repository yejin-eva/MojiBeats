import sampleUrl from '../assets/mp3/\'Dolce Vita\' by Peyruis    Energetic Music (No Copyright).mp3';
import { getAllSongs, saveSong } from './SongLibrary.js';
import { EMOJI_POOL } from '../config.js';
import AudioManager from '../audio/AudioManager.js';
import { analyzeBeats } from '../audio/BeatDetector.js';

const EXAMPLE_TITLE = 'Dolce Vita';

export async function ensureExampleSong() {
  const songs = await getAllSongs();
  const exists = songs.some(s => s.title === EXAMPLE_TITLE);
  if (exists) return;

  const response = await fetch(sampleUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });

  const audioManager = new AudioManager();
  await audioManager.loadFile(audioBlob);

  const channelData = audioManager.getChannelData();
  const sampleRate = audioManager.getSampleRate();
  const { beats, bpm } = analyzeBeats(channelData, sampleRate);

  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];

  await saveSong({
    title: EXAMPLE_TITLE,
    bpm,
    audioBlob,
    emoji,
    beatCount: beats.length,
  });

  console.log(`[MojiBeats] Example song "${EXAMPLE_TITLE}" installed (${beats.length} beats, ${bpm.toFixed(1)} BPM)`);
}

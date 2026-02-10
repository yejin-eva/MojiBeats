import gameboy from '../assets/mp3/Gameboy.mp3';
import her from '../assets/mp3/HER.mp3';
import hypeBoy from '../assets/mp3/Hype Boy.mp3';
import standingNextToYou from '../assets/mp3/Jungkook \'Standing Next To You\' Lyrics.mp3';
import spaghetti from '../assets/mp3/LE SSERAFIM \'Spaghetti\' (Color Coded Lyrics).mp3';
import baby from '../assets/mp3/Justin Bieber - Baby ft. Ludacris (Lyrics).mp3';
import dancingDays from '../assets/mp3/Lazy Lewis - Dancing Days.mp3';
import manchild from '../assets/mp3/Manchild.mp3';
import midnightSun from '../assets/mp3/Midnight Sun.mp3';
import itsBucky from '../assets/mp3/Son Lux - It\'s Bucky! (From ThunderboltsVisualizer Video).mp3';
import speedDrive from '../assets/mp3/Speed Drive.mp3';
import good4u from '../assets/mp3/good 4 u.mp3';

const MANIFEST = [
  { id: 'ex-gameboy', title: 'Gameboy', bpm: 120, beatCount: 240, emoji: '🎮', url: gameboy },
  { id: 'ex-her', title: 'HER', bpm: 90, beatCount: 180, emoji: '💜', url: her },
  { id: 'ex-hype-boy', title: 'Hype Boy', bpm: 130, beatCount: 270, emoji: '🐰', url: hypeBoy },
  { id: 'ex-standing-next-to-you', title: 'Standing Next To You', bpm: 110, beatCount: 230, emoji: '🕺', url: standingNextToYou },
  { id: 'ex-spaghetti', title: 'Spaghetti', bpm: 125, beatCount: 250, emoji: '🍝', url: spaghetti },
  { id: 'ex-baby', title: 'Baby', bpm: 130, beatCount: 280, emoji: '🎤', url: baby },
  { id: 'ex-dancing-days', title: 'Dancing Days', bpm: 120, beatCount: 240, emoji: '💃', url: dancingDays },
  { id: 'ex-manchild', title: 'Manchild', bpm: 110, beatCount: 220, emoji: '😈', url: manchild },
  { id: 'ex-midnight-sun', title: 'Midnight Sun', bpm: 100, beatCount: 200, emoji: '🌙', url: midnightSun },
  { id: 'ex-its-bucky', title: "It's Bucky!", bpm: 120, beatCount: 240, emoji: '⚡', url: itsBucky },
  { id: 'ex-speed-drive', title: 'Speed Drive', bpm: 140, beatCount: 300, emoji: '🏎️', url: speedDrive },
  { id: 'ex-good4u', title: 'good 4 u', bpm: 166, beatCount: 350, emoji: '🤘', url: good4u },
];

const DELETED_KEY = 'mojibeats_deleted_examples';

function getDeletedExamples() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function markExampleDeleted(title) {
  const deleted = getDeletedExamples();
  if (!deleted.includes(title)) {
    deleted.push(title);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
  }
}

export function getExampleSongById(id) {
  const entry = MANIFEST.find(s => s.id === id);
  if (!entry) return null;
  return {
    id: entry.id,
    title: entry.title,
    bpm: entry.bpm,
    beatCount: entry.beatCount,
    emoji: entry.emoji,
    type: 'example',
    url: entry.url,
    dateAdded: 0,
    playCount: 0,
  };
}

export function getExampleSongs() {
  const deleted = getDeletedExamples();
  return MANIFEST
    .filter(s => !deleted.includes(s.title))
    .map(s => ({
      id: s.id,
      title: s.title,
      bpm: s.bpm,
      beatCount: s.beatCount,
      emoji: s.emoji,
      type: 'example',
      url: s.url,
      dateAdded: 0,
      playCount: 0,
    }));
}

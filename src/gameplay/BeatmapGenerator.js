import {
  GROW_DURATION, EMOJI_POOL, TARGET_COLORS,
  GAME_WIDTH, GAME_HEIGHT
} from '../config.js';

const MARGIN_X = 100;
const MARGIN_TOP = 120;
const MARGIN_BOTTOM = 60;
const MIN_SPACING = 0.4;

export function filterBeats(beats, bpm) {
  if (beats.length === 0) return [];

  const beatInterval = bpm > 0 ? 60 / bpm : MIN_SPACING;
  const snapWindow = beatInterval * 0.3;

  const gridBeats = [];
  if (bpm > 0) {
    const firstBeat = beats[0];
    const lastBeat = beats[beats.length - 1];
    for (let t = firstBeat; t <= lastBeat; t += beatInterval) {
      gridBeats.push(t);
    }
  }

  const selected = [];

  for (const beat of beats) {
    if (selected.length > 0 && beat - selected[selected.length - 1] < MIN_SPACING) {
      continue;
    }

    if (bpm > 0) {
      let nearGrid = false;
      for (const g of gridBeats) {
        if (Math.abs(beat - g) <= snapWindow) {
          nearGrid = true;
          break;
        }
      }
      if (!nearGrid) continue;
    }

    selected.push(beat);
  }

  return selected;
}

export function generateBeatmap(beats, bpm) {
  const filtered = bpm ? filterBeats(beats, bpm) : beats;
  if (filtered.length === 0) return [];

  const playWidth = GAME_WIDTH - MARGIN_X * 2;
  const playHeight = GAME_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  return filtered.map((beatTime, i) => ({
    beatTime,
    spawnTime: beatTime - GROW_DURATION,
    x: MARGIN_X + Math.random() * playWidth,
    y: MARGIN_TOP + Math.random() * playHeight,
    emoji: EMOJI_POOL[i % EMOJI_POOL.length],
    color: TARGET_COLORS[i % TARGET_COLORS.length]
  }));
}

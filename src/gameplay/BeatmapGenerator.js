import {
  GROW_DURATION, EMOJI_POOL, TARGET_COLORS,
  GAME_WIDTH, GAME_HEIGHT, PROXIMITY
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

export function computeNextPosition(prev, timeDelta, playWidth, playHeight, marginX, marginTop) {
  const randX = marginX + Math.random() * playWidth;
  const randY = marginTop + Math.random() * playHeight;

  if (!prev) return { x: randX, y: randY };

  const t = Math.min(timeDelta / PROXIMITY.FULL_RANDOM_GAP, 1);

  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * PROXIMITY.MAX_DRIFT;
  const driftX = prev.x + Math.cos(angle) * dist;
  const driftY = prev.y + Math.sin(angle) * dist;

  const rawX = driftX + (randX - driftX) * t;
  const rawY = driftY + (randY - driftY) * t;

  return {
    x: Math.max(marginX, Math.min(marginX + playWidth, rawX)),
    y: Math.max(marginTop, Math.min(marginTop + playHeight, rawY))
  };
}

export function generateBeatmap(beats, bpm) {
  const filtered = bpm ? filterBeats(beats, bpm) : beats;
  if (filtered.length === 0) return [];

  const playWidth = GAME_WIDTH - MARGIN_X * 2;
  const playHeight = GAME_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  let prev = null;
  return filtered.map((beatTime, i) => {
    const timeDelta = prev ? beatTime - prev.beatTime : 0;
    const pos = computeNextPosition(prev, timeDelta, playWidth, playHeight, MARGIN_X, MARGIN_TOP);

    const event = {
      beatTime,
      spawnTime: beatTime - GROW_DURATION,
      x: pos.x,
      y: pos.y,
      emoji: EMOJI_POOL[i % EMOJI_POOL.length],
      color: TARGET_COLORS[i % TARGET_COLORS.length]
    };
    prev = event;
    return event;
  });
}

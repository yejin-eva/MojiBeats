import {
  GROW_DURATION, EMOJI_POOL, TARGET_COLORS,
  GAME_WIDTH, GAME_HEIGHT
} from '../config.js';

const MARGIN_X = 100;
const MARGIN_TOP = 120;
const MARGIN_BOTTOM = 60;

export function generateBeatmap(beats) {
  if (beats.length === 0) return [];

  const playWidth = GAME_WIDTH - MARGIN_X * 2;
  const playHeight = GAME_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  return beats.map((beatTime, i) => ({
    beatTime,
    spawnTime: beatTime - GROW_DURATION,
    x: MARGIN_X + Math.random() * playWidth,
    y: MARGIN_TOP + Math.random() * playHeight,
    emoji: EMOJI_POOL[i % EMOJI_POOL.length],
    color: TARGET_COLORS[i % TARGET_COLORS.length]
  }));
}

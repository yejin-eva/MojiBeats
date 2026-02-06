import { describe, it, expect } from 'vitest';
import { generateBeatmap } from '../../src/gameplay/BeatmapGenerator.js';
import { GROW_DURATION, EMOJI_POOL, TARGET_COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../src/config.js';

describe('generateBeatmap', () => {
  const beats = [1.0, 2.0, 3.0, 4.0, 5.0];

  it('returns one event per beat', () => {
    const map = generateBeatmap(beats);
    expect(map.length).toBe(beats.length);
  });

  it('sets beatTime to the original beat timestamp', () => {
    const map = generateBeatmap(beats);
    for (let i = 0; i < beats.length; i++) {
      expect(map[i].beatTime).toBe(beats[i]);
    }
  });

  it('sets spawnTime = beatTime - GROW_DURATION', () => {
    const map = generateBeatmap(beats);
    for (const event of map) {
      expect(event.spawnTime).toBeCloseTo(event.beatTime - GROW_DURATION);
    }
  });

  it('assigns x within play area bounds', () => {
    const margin = 100;
    const map = generateBeatmap(beats);
    for (const event of map) {
      expect(event.x).toBeGreaterThanOrEqual(margin);
      expect(event.x).toBeLessThanOrEqual(GAME_WIDTH - margin);
    }
  });

  it('assigns y within play area bounds', () => {
    const marginTop = 120;
    const marginBottom = 60;
    const map = generateBeatmap(beats);
    for (const event of map) {
      expect(event.y).toBeGreaterThanOrEqual(marginTop);
      expect(event.y).toBeLessThanOrEqual(GAME_HEIGHT - marginBottom);
    }
  });

  it('assigns emoji from the emoji pool', () => {
    const map = generateBeatmap(beats);
    for (const event of map) {
      expect(EMOJI_POOL).toContain(event.emoji);
    }
  });

  it('assigns color from target colors', () => {
    const map = generateBeatmap(beats);
    for (const event of map) {
      expect(TARGET_COLORS).toContain(event.color);
    }
  });

  it('returns empty array for empty beats', () => {
    expect(generateBeatmap([])).toEqual([]);
  });

  it('returns events sorted by spawnTime', () => {
    const map = generateBeatmap(beats);
    for (let i = 1; i < map.length; i++) {
      expect(map[i].spawnTime).toBeGreaterThanOrEqual(map[i - 1].spawnTime);
    }
  });
});

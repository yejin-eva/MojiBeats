import { describe, it, expect } from 'vitest';
import { generateBeatmap, filterBeats, generateYouTubeBeats } from '../../src/gameplay/BeatmapGenerator.js';
import { GROW_DURATION, EMOJI_POOL, TARGET_COLORS, GAME_WIDTH, GAME_HEIGHT, DIFFICULTY } from '../../src/config.js';

describe('generateBeatmap', () => {
  const beats = [1.0, 2.0, 3.0, 4.0, 5.0];

  it('returns events for each beat when no bpm provided', () => {
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

  it('filters beats when bpm is provided', () => {
    // Dense onsets at ~0.1s intervals
    const dense = [];
    for (let t = 0.1; t < 10; t += 0.1) dense.push(t);
    const map = generateBeatmap(dense, 120);
    expect(map.length).toBeLessThan(dense.length);
    expect(map.length).toBeGreaterThan(0);
  });
});

describe('filterBeats', () => {
  it('returns empty for empty input', () => {
    expect(filterBeats([], 120)).toEqual([]);
  });

  it('enforces minimum spacing', () => {
    const beats = [1.0, 1.1, 1.2, 1.3, 1.5, 2.0, 2.05, 2.5];
    const filtered = filterBeats(beats, 120);
    for (let i = 1; i < filtered.length; i++) {
      expect(filtered[i] - filtered[i - 1]).toBeGreaterThanOrEqual(0.39);
    }
  });

  it('reduces dense onsets significantly', () => {
    // 100 onsets in 10 seconds = 10/sec
    const dense = [];
    for (let t = 0.1; t < 10; t += 0.1) dense.push(t);
    const filtered = filterBeats(dense, 120);
    // At 120 BPM with 0.4s min spacing, expect roughly 20-25 beats in 10s
    expect(filtered.length).toBeLessThan(30);
    expect(filtered.length).toBeGreaterThan(10);
  });

  it('keeps beats that align with BPM grid', () => {
    // Beats exactly on 120 BPM grid (0.5s intervals)
    const onGrid = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
    const filtered = filterBeats(onGrid, 120);
    expect(filtered.length).toBe(onGrid.length);
  });

  it('rejects beats far from BPM grid', () => {
    // Grid anchored at first beat (0.5), points: 0.5, 1.0, 1.5, 2.0, 2.5
    // snapWindow = 0.15s at 120 BPM. These beats are ~0.25s from nearest grid point
    const offGrid = [0.5, 0.76, 1.26, 1.76, 2.26];
    const filtered = filterBeats(offGrid, 120);
    // Only the anchor beat (0.5) survives; rest are off-grid
    expect(filtered.length).toBe(1);
    expect(filtered[0]).toBe(0.5);
  });

  it('Easy minSpacing produces fewer beats than Normal', () => {
    const dense = [];
    for (let t = 0.1; t < 10; t += 0.1) dense.push(t);
    const easy = filterBeats(dense, 120, DIFFICULTY.EASY.minSpacing);
    const normal = filterBeats(dense, 120, DIFFICULTY.NORMAL.minSpacing);
    expect(easy.length).toBeLessThan(normal.length);
  });

  it('Hard minSpacing produces more beats than Normal', () => {
    const dense = [];
    for (let t = 0.1; t < 10; t += 0.1) dense.push(t);
    const hard = filterBeats(dense, 120, DIFFICULTY.HARD.minSpacing);
    const normal = filterBeats(dense, 120, DIFFICULTY.NORMAL.minSpacing);
    expect(hard.length).toBeGreaterThan(normal.length);
  });
});

describe('generateYouTubeBeats', () => {
  it('generates evenly spaced beats at BPM interval', () => {
    const beats = generateYouTubeBeats(120, 10);
    const interval = 60 / 120; // 0.5s
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i] - beats[i - 1]).toBeCloseTo(interval);
    }
  });

  it('starts one beat in (not at time 0)', () => {
    const beats = generateYouTubeBeats(120, 10);
    expect(beats[0]).toBeCloseTo(0.5);
  });

  it('ends before duration - 1', () => {
    const beats = generateYouTubeBeats(120, 10);
    const last = beats[beats.length - 1];
    expect(last).toBeLessThan(10 - 1);
  });

  it('returns empty for very short duration', () => {
    const beats = generateYouTubeBeats(120, 1);
    expect(beats.length).toBe(0);
  });

  it('produces correct count for known BPM and duration', () => {
    // 60 BPM = 1 beat/sec, duration 10s
    // Beats at: 1, 2, 3, 4, 5, 6, 7, 8 (9 would be >= 10-1)
    const beats = generateYouTubeBeats(60, 10);
    expect(beats.length).toBe(8);
  });

  it('produces more beats at higher BPM', () => {
    const slow = generateYouTubeBeats(60, 30);
    const fast = generateYouTubeBeats(180, 30);
    expect(fast.length).toBeGreaterThan(slow.length);
  });

  it('feeds into generateBeatmap correctly', () => {
    const beats = generateYouTubeBeats(120, 10);
    const map = generateBeatmap(beats, 120);
    expect(map.length).toBeGreaterThan(0);
    for (const event of map) {
      expect(event).toHaveProperty('beatTime');
      expect(event).toHaveProperty('spawnTime');
      expect(event).toHaveProperty('x');
      expect(event).toHaveProperty('y');
    }
  });
});

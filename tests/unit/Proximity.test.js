import { describe, it, expect } from 'vitest';
import { computeNextPosition } from '../../src/gameplay/BeatmapGenerator.js';

const PLAY_WIDTH = 1080;
const PLAY_HEIGHT = 540;
const MARGIN_X = 100;
const MARGIN_TOP = 120;

describe('computeNextPosition', () => {
  it('distance is proportional to time delta', () => {
    const prev = { x: 640, y: 360 };
    const heading = 0;

    const shortDists = [];
    const longDists = [];
    for (let i = 0; i < 50; i++) {
      const short = computeNextPosition(prev, 0.2, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP, heading);
      const long = computeNextPosition(prev, 0.8, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP, heading);
      shortDists.push(Math.hypot(short.x - prev.x, short.y - prev.y));
      longDists.push(Math.hypot(long.x - prev.x, long.y - prev.y));
    }
    const avgShort = shortDists.reduce((a, b) => a + b) / shortDists.length;
    const avgLong = longDists.reduce((a, b) => a + b) / longDists.length;
    expect(avgLong).toBeGreaterThan(avgShort);
  });

  it('jumps to random position on break (large time gap)', () => {
    const prev = { x: 200, y: 200 };
    const heading = 0;
    const results = [];
    for (let i = 0; i < 30; i++) {
      results.push(computeNextPosition(prev, 3.0, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP, heading));
    }
    const dists = results.map(p => Math.hypot(p.x - prev.x, p.y - prev.y));
    const avgDist = dists.reduce((a, b) => a + b) / dists.length;
    expect(avgDist).toBeGreaterThan(100);
  });

  it('always stays within play area bounds', () => {
    const corners = [
      { x: MARGIN_X, y: MARGIN_TOP },
      { x: MARGIN_X + PLAY_WIDTH, y: MARGIN_TOP + PLAY_HEIGHT },
      { x: MARGIN_X, y: MARGIN_TOP + PLAY_HEIGHT },
      { x: MARGIN_X + PLAY_WIDTH, y: MARGIN_TOP }
    ];
    for (const prev of corners) {
      let heading = 0;
      for (let i = 0; i < 50; i++) {
        const pos = computeNextPosition(prev, 0.5, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP, heading);
        heading = pos.heading;
        expect(pos.x).toBeGreaterThanOrEqual(MARGIN_X);
        expect(pos.x).toBeLessThanOrEqual(MARGIN_X + PLAY_WIDTH);
        expect(pos.y).toBeGreaterThanOrEqual(MARGIN_TOP);
        expect(pos.y).toBeLessThanOrEqual(MARGIN_TOP + PLAY_HEIGHT);
      }
    }
  });

  it('returns random position when no previous position', () => {
    const pos = computeNextPosition(null, 0, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP, 0);
    expect(pos.x).toBeGreaterThanOrEqual(MARGIN_X);
    expect(pos.x).toBeLessThanOrEqual(MARGIN_X + PLAY_WIDTH);
    expect(pos.y).toBeGreaterThanOrEqual(MARGIN_TOP);
    expect(pos.y).toBeLessThanOrEqual(MARGIN_TOP + PLAY_HEIGHT);
    expect(pos).toHaveProperty('heading');
  });

  it('returns a heading value with each position', () => {
    const prev = { x: 640, y: 360 };
    const pos = computeNextPosition(prev, 0.4, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP, 1.0);
    expect(typeof pos.heading).toBe('number');
  });
});

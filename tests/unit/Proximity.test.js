import { describe, it, expect } from 'vitest';
import { computeNextPosition } from '../../src/gameplay/BeatmapGenerator.js';

const PLAY_WIDTH = 1080;
const PLAY_HEIGHT = 540;
const MARGIN_X = 100;
const MARGIN_TOP = 120;

describe('computeNextPosition', () => {
  it('stays close to previous position when timeDelta is small', () => {
    const prev = { x: 640, y: 360 };
    const results = [];
    for (let i = 0; i < 50; i++) {
      results.push(computeNextPosition(prev, 0.4, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP));
    }
    for (const pos of results) {
      const dist = Math.hypot(pos.x - prev.x, pos.y - prev.y);
      // With small timeDelta, distance should be bounded
      expect(dist).toBeLessThan(300);
    }
  });

  it('produces wider spread when timeDelta is large', () => {
    const prev = { x: 640, y: 360 };
    const closeDists = [];
    const farDists = [];
    for (let i = 0; i < 100; i++) {
      const close = computeNextPosition(prev, 0.4, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP);
      const far = computeNextPosition(prev, 3.0, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP);
      closeDists.push(Math.hypot(close.x - prev.x, close.y - prev.y));
      farDists.push(Math.hypot(far.x - prev.x, far.y - prev.y));
    }
    const avgClose = closeDists.reduce((a, b) => a + b) / closeDists.length;
    const avgFar = farDists.reduce((a, b) => a + b) / farDists.length;
    expect(avgFar).toBeGreaterThan(avgClose);
  });

  it('always stays within play area bounds', () => {
    // Test from corners to ensure clamping works
    const corners = [
      { x: MARGIN_X, y: MARGIN_TOP },
      { x: MARGIN_X + PLAY_WIDTH, y: MARGIN_TOP + PLAY_HEIGHT },
      { x: MARGIN_X, y: MARGIN_TOP + PLAY_HEIGHT },
      { x: MARGIN_X + PLAY_WIDTH, y: MARGIN_TOP }
    ];
    for (const prev of corners) {
      for (let i = 0; i < 50; i++) {
        const pos = computeNextPosition(prev, 0.5, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP);
        expect(pos.x).toBeGreaterThanOrEqual(MARGIN_X);
        expect(pos.x).toBeLessThanOrEqual(MARGIN_X + PLAY_WIDTH);
        expect(pos.y).toBeGreaterThanOrEqual(MARGIN_TOP);
        expect(pos.y).toBeLessThanOrEqual(MARGIN_TOP + PLAY_HEIGHT);
      }
    }
  });

  it('returns fully random position when no previous position', () => {
    const pos = computeNextPosition(null, 0, PLAY_WIDTH, PLAY_HEIGHT, MARGIN_X, MARGIN_TOP);
    expect(pos.x).toBeGreaterThanOrEqual(MARGIN_X);
    expect(pos.x).toBeLessThanOrEqual(MARGIN_X + PLAY_WIDTH);
    expect(pos.y).toBeGreaterThanOrEqual(MARGIN_TOP);
    expect(pos.y).toBeLessThanOrEqual(MARGIN_TOP + PLAY_HEIGHT);
  });
});

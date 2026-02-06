import { describe, it, expect } from 'vitest';
import {
  createScoreState,
  applyHit,
  applyMiss,
  getAccuracy
} from '../../src/gameplay/ScoreSystem.js';
import { SCORING } from '../../src/config.js';

describe('createScoreState', () => {
  it('starts at zero', () => {
    const state = createScoreState();
    expect(state.score).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.maxCombo).toBe(0);
    expect(state.hits).toBe(0);
    expect(state.misses).toBe(0);
  });
});

describe('applyHit', () => {
  it('adds base score for perfect with no combo', () => {
    const state = createScoreState();
    const next = applyHit(state, 'perfect');
    expect(next.score).toBe(SCORING.PERFECT);
  });

  it('increments combo', () => {
    const state = createScoreState();
    const next = applyHit(state, 'perfect');
    expect(next.combo).toBe(1);
    const next2 = applyHit(next, 'great');
    expect(next2.combo).toBe(2);
  });

  it('applies combo multiplier to score', () => {
    let state = createScoreState();
    state = applyHit(state, 'perfect'); // combo 1, score = 300 * 1
    state = applyHit(state, 'perfect'); // combo 2, score += 300 * 2
    expect(state.score).toBe(300 + 600);
  });

  it('tracks max combo', () => {
    let state = createScoreState();
    state = applyHit(state, 'perfect');
    state = applyHit(state, 'perfect');
    state = applyMiss(state);
    state = applyHit(state, 'perfect');
    expect(state.maxCombo).toBe(2);
  });

  it('counts hits', () => {
    let state = createScoreState();
    state = applyHit(state, 'perfect');
    state = applyHit(state, 'great');
    state = applyHit(state, 'good');
    expect(state.hits).toBe(3);
  });

  it('scores correctly for each tier', () => {
    const p = applyHit(createScoreState(), 'perfect');
    const gr = applyHit(createScoreState(), 'great');
    const go = applyHit(createScoreState(), 'good');
    expect(p.score).toBe(SCORING.PERFECT);
    expect(gr.score).toBe(SCORING.GREAT);
    expect(go.score).toBe(SCORING.GOOD);
  });
});

describe('applyMiss', () => {
  it('resets combo to 0', () => {
    let state = createScoreState();
    state = applyHit(state, 'perfect');
    state = applyHit(state, 'perfect');
    state = applyMiss(state);
    expect(state.combo).toBe(0);
  });

  it('does not change score', () => {
    let state = createScoreState();
    state = applyHit(state, 'perfect');
    const scoreBefore = state.score;
    state = applyMiss(state);
    expect(state.score).toBe(scoreBefore);
  });

  it('increments misses', () => {
    let state = createScoreState();
    state = applyMiss(state);
    state = applyMiss(state);
    expect(state.misses).toBe(2);
  });

  it('preserves max combo', () => {
    let state = createScoreState();
    state = applyHit(state, 'perfect');
    state = applyHit(state, 'perfect');
    state = applyHit(state, 'perfect');
    state = applyMiss(state);
    expect(state.maxCombo).toBe(3);
  });
});

describe('getAccuracy', () => {
  it('returns 100 for all hits', () => {
    let state = createScoreState();
    state = applyHit(state, 'perfect');
    state = applyHit(state, 'perfect');
    expect(getAccuracy(state)).toBe(100);
  });

  it('returns 0 for all misses', () => {
    let state = createScoreState();
    state = applyMiss(state);
    state = applyMiss(state);
    expect(getAccuracy(state)).toBe(0);
  });

  it('returns 50 for half and half', () => {
    let state = createScoreState();
    state = applyHit(state, 'perfect');
    state = applyMiss(state);
    expect(getAccuracy(state)).toBe(50);
  });

  it('returns 0 for no notes', () => {
    expect(getAccuracy(createScoreState())).toBe(0);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateGrade,
  betterGrade,
  saveScore,
  getScoreForSong,
  getScores,
} from '../../src/storage/ScoreStore.js';

// Mock localStorage
const store = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; },
  });
});

describe('calculateGrade', () => {
  it('returns S for 95+', () => {
    expect(calculateGrade(95)).toBe('S');
    expect(calculateGrade(100)).toBe('S');
  });

  it('returns A for 85-94', () => {
    expect(calculateGrade(85)).toBe('A');
    expect(calculateGrade(94)).toBe('A');
  });

  it('returns B for 70-84', () => {
    expect(calculateGrade(70)).toBe('B');
    expect(calculateGrade(84)).toBe('B');
  });

  it('returns C for 50-69', () => {
    expect(calculateGrade(50)).toBe('C');
    expect(calculateGrade(69)).toBe('C');
  });

  it('returns D for below 50', () => {
    expect(calculateGrade(49)).toBe('D');
    expect(calculateGrade(0)).toBe('D');
  });
});

describe('betterGrade', () => {
  it('S beats everything', () => {
    expect(betterGrade('S', 'A')).toBe('S');
    expect(betterGrade('S', 'D')).toBe('S');
  });

  it('returns higher grade', () => {
    expect(betterGrade('B', 'A')).toBe('A');
    expect(betterGrade('C', 'B')).toBe('B');
  });

  it('returns same grade when equal', () => {
    expect(betterGrade('A', 'A')).toBe('A');
  });
});

describe('saveScore', () => {
  it('creates new entry for unknown song with difficulty', () => {
    const result = saveScore('song1', {
      score: 5000,
      maxCombo: 20,
      accuracy: 85,
      grade: 'A',
      difficultyKey: 'NORMAL',
    });
    expect(result.bestScore).toBe(5000);
    expect(result.bestCombo).toBe(20);
    expect(result.bestAccuracy).toBe(85);
    expect(result.grade).toBe('A');
    expect(result.plays).toBe(1);
  });

  it('keeps max of each field on second play same difficulty', () => {
    saveScore('song1', { score: 5000, maxCombo: 20, accuracy: 85, grade: 'A', difficultyKey: 'EASY' });
    const result = saveScore('song1', { score: 3000, maxCombo: 30, accuracy: 70, grade: 'B', difficultyKey: 'EASY' });
    expect(result.bestScore).toBe(5000);
    expect(result.bestCombo).toBe(30);
    expect(result.bestAccuracy).toBe(85);
    expect(result.grade).toBe('A');
    expect(result.plays).toBe(2);
  });

  it('upgrades grade when new play is better', () => {
    saveScore('song1', { score: 3000, maxCombo: 10, accuracy: 70, grade: 'B', difficultyKey: 'HARD' });
    const result = saveScore('song1', { score: 8000, maxCombo: 50, accuracy: 96, grade: 'S', difficultyKey: 'HARD' });
    expect(result.grade).toBe('S');
  });

  it('stores different difficulties independently', () => {
    saveScore('song1', { score: 5000, maxCombo: 20, accuracy: 85, grade: 'A', difficultyKey: 'EASY' });
    saveScore('song1', { score: 3000, maxCombo: 10, accuracy: 70, grade: 'B', difficultyKey: 'HARD' });
    const scores = getScoreForSong('song1');
    expect(scores.EASY.bestScore).toBe(5000);
    expect(scores.HARD.bestScore).toBe(3000);
  });
});

describe('getScoreForSong', () => {
  it('returns null for unknown song', () => {
    expect(getScoreForSong('nonexistent')).toBeNull();
  });

  it('returns per-difficulty scores', () => {
    saveScore('song1', { score: 5000, maxCombo: 20, accuracy: 85, grade: 'A', difficultyKey: 'NORMAL' });
    const result = getScoreForSong('song1');
    expect(result.NORMAL.bestScore).toBe(5000);
    expect(result.NORMAL.grade).toBe('A');
  });

  it('returns null for old format scores', () => {
    store['mojibeats_scores'] = JSON.stringify({ song1: { bestScore: 5000, grade: 'A', plays: 1 } });
    expect(getScoreForSong('song1')).toBeNull();
  });
});

describe('getScores', () => {
  it('returns empty object when no scores', () => {
    expect(getScores()).toEqual({});
  });

  it('returns all scores', () => {
    saveScore('song1', { score: 5000, maxCombo: 20, accuracy: 85, grade: 'A', difficultyKey: 'NORMAL' });
    saveScore('song2', { score: 3000, maxCombo: 10, accuracy: 70, grade: 'B', difficultyKey: 'EASY' });
    const scores = getScores();
    expect(Object.keys(scores)).toHaveLength(2);
  });
});

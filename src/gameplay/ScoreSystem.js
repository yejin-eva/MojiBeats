import { SCORING } from '../config.js';

export function createScoreState() {
  return { score: 0, combo: 0, maxCombo: 0, hits: 0, misses: 0 };
}

export function applyHit(state, tier) {
  const base = SCORING[tier.toUpperCase()] || 0;
  const combo = state.combo + 1;
  const score = state.score + base * combo;
  const maxCombo = Math.max(state.maxCombo, combo);
  return { ...state, score, combo, maxCombo, hits: state.hits + 1 };
}

export function applyMiss(state) {
  return { ...state, combo: 0, misses: state.misses + 1 };
}

export function getAccuracy(state) {
  const total = state.hits + state.misses;
  if (total === 0) return 0;
  return Math.round((state.hits / total) * 100);
}

import { STORAGE } from '../config.js';

const GRADE_RANKS = { S: 5, A: 4, B: 3, C: 2, D: 1 };

export function calculateGrade(accuracy) {
  if (accuracy >= 95) return 'S';
  if (accuracy >= 85) return 'A';
  if (accuracy >= 70) return 'B';
  if (accuracy >= 50) return 'C';
  return 'D';
}

export function betterGrade(a, b) {
  return (GRADE_RANKS[a] || 0) >= (GRADE_RANKS[b] || 0) ? a : b;
}

function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE.SCORES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistScores(scores) {
  localStorage.setItem(STORAGE.SCORES_KEY, JSON.stringify(scores));
}

export function saveScore(songId, { score, maxCombo, accuracy, grade, difficultyKey }) {
  const scores = loadScores();
  if (!scores[songId] || scores[songId].bestScore !== undefined) {
    scores[songId] = {};
  }

  const key = difficultyKey || '_default';
  const existing = scores[songId][key];

  if (!existing) {
    scores[songId][key] = {
      bestScore: score,
      bestCombo: maxCombo,
      bestAccuracy: accuracy,
      grade,
      plays: 1,
    };
  } else {
    scores[songId][key] = {
      bestScore: Math.max(existing.bestScore, score),
      bestCombo: Math.max(existing.bestCombo, maxCombo),
      bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
      grade: betterGrade(grade, existing.grade),
      plays: existing.plays + 1,
    };
  }

  persistScores(scores);
  return scores[songId][key];
}

export function getScoreForSong(songId) {
  const scores = loadScores();
  const songScores = scores[songId];
  if (!songScores) return null;
  if (songScores.bestScore !== undefined) return null;
  return songScores;
}

export function getScores() {
  return loadScores();
}

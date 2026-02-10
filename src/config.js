// Game dimensions
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Timing windows (ms from perfect beat)
export const TIMING = {
  PERFECT: 50,
  GREAT: 130,
  GOOD: 200
};

// Health system
export const HEALTH = {
  MAX: 100,
  DAMAGE_PER_MISS: 10,
  COMBO_HEAL_AMOUNT: 5,
  COMBO_HEAL_THRESHOLD: 10
};

// Scoring
export const SCORING = {
  PERFECT: 300,
  GREAT: 200,
  GOOD: 100,
  MISS: 0
};

// Emoji pool
export const EMOJI_POOL = [
  '👾', '👻', '🤖', '😈', '🎃',
  '💀', '👹', '🐉', '🦠', '👽',
  '🔥', '💣', '☠️', '🕷️', '🦇'
];

// Target outline colors
export const TARGET_COLORS = [
  0xa78bfa, // lavender (theme)
  0x9b59b6, // purple
  0x3498db, // blue
  0x2ecc71, // green
  0xe74c3c, // red
  0xf39c12  // orange
];

// Grow duration (seconds)
export const GROW_DURATION = 1.2;

// Key bindings
export const KEYS = {
  HIT_1: 'SPACE',
  HIT_2: 'Z',
  HIT_3: 'X'
};

// Countdown before song starts
export const COUNTDOWN_DURATION = 3;

// Scene keys
export const SCENES = {
  BOOT: 'BootScene',
  SONG_SELECT: 'SongSelectScene',
  GAMEPLAY: 'GameplayScene',
  GAME_OVER: 'GameOverScene',
  VICTORY: 'VictoryScene'
};

// Emoji texture caching
export const EMOJI_TEXTURE = {
  CANVAS_SIZE: 96,
  FONT_SIZE: 64,
  DILATION_RADIUS: 3,
  FONT_FAMILY: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
  DISPLAY_SCALE: 1.5
};

// Spatial proximity: beat timing maps to screen distance
export const PROXIMITY = {
  PX_PER_SECOND: GAME_WIDTH * 0.23,  // ~23% of width per second of gap
  MAX_STEP: GAME_WIDTH * 0.31,       // cap at ~31% of width per step
  BREAK_GAP: 2.0,                    // seconds: gaps above this jump to a new area
  WANDER_RATE: 0.6,                  // radians of heading drift per step (randomized ±)
};

// Urgency indicator: outline shifts color as beat time approaches
export const URGENCY = {
  START_PROGRESS: 0.3,     // urgency tinting begins at 30% grow progress
  GRADIENT: [
    { at: 0.0, color: 0xc4b5fd },  // soft lavender (far)
    { at: 0.35, color: 0x9b7be8 }, // purple (so-so)
    { at: 0.7, color: 0xec4899 },  // pink (getting close)
    { at: 1.0, color: 0xf51d42 },  // red (imminent)
  ],
};

// Sticky note UI
export const STICKY_NOTE = {
  COLORS: [
    { bg: '#fff9c4', border: '#f9a825', text: '#5d4037' },  // yellow
    { bg: '#fce4ec', border: '#e91e63', text: '#880e4f' },  // pink
    { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },  // blue
    { bg: '#e8f5e9', border: '#388e3c', text: '#1b5e20' },  // green
    { bg: '#f3e5f5', border: '#7b1fa2', text: '#4a148c' },  // purple
  ],
  WIDTH: 170,
  HEIGHT: 130,
  COLLAPSED_Y: 660,
  PEEK_Y: 625,
  SELECTED_Y: 300,
  SELECTED_SCALE: 1.8,
  FAN_OVERLAP: 30,
  MAX_VISIBLE: 6,
  TILT_RANGE: 8,
  PEEK_DURATION: 200,
  LIFT_DURATION: 400,
};

// Difficulty levels (minSpacing + sensitivity control beat density)
export const DIFFICULTY = {
  EASY:   { label: 'Easy',   minSpacing: 0.8, sensitivity: { thresholdMultiplier: 2.2, minPeakInterval: 0.3, useGrid: true },   color: '#34d399' },
  NORMAL: { label: 'Normal', minSpacing: 0.4, sensitivity: { thresholdMultiplier: 1.8, minPeakInterval: 0.15, useGrid: true },  color: '#fbbf24' },
  HARD:   { label: 'Hard',   minSpacing: 0.2, sensitivity: { thresholdMultiplier: 1.0, minPeakInterval: 0.1, useGrid: false },  color: '#ef4444' },
};

// Storage
export const STORAGE = {
  DB_NAME: 'MojiBeats',
  DB_VERSION: 1,
  SONGS_STORE: 'songs',
  SCORES_KEY: 'mojibeats_scores',
};

// YouTube
export const YOUTUBE = {
  DEFAULT_BPM: 120,
};

// Theme
export const THEME = {
  PRIMARY: '#7c3aed',
  PRIMARY_HOVER: '#6d28d9',
  PRIMARY_HEX: 0x7c3aed,
};

export const THEME_FONT = 'FriendlyScribbles';

// Notebook background
export const NOTEBOOK = {
  BG_COLOR: '#f8f8f8',
  GRID_COLOR: 0xd4e4f7,
  GRID_ALPHA: 0.4,
  GRID_SPACING: 28,
  MARGIN_COLOR: 0xf0a0a0,
  MARGIN_ALPHA: 0.5,
  MARGIN_X: Math.round(GAME_WIDTH * 0.1125)
};

// Timing windows (ms from perfect beat)
export const TIMING = {
  PERFECT: 30,
  GREAT: 80,
  GOOD: 120
};

// Health system
export const HEALTH = {
  MAX: 100,
  DAMAGE_PER_MISS: 7,
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
  0xff69b4, // pink
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
  HIT_1: 'Z',
  HIT_2: 'X'
};

// Scene keys
export const SCENES = {
  BOOT: 'BootScene',
  SONG_SELECT: 'SongSelectScene',
  GAMEPLAY: 'GameplayScene',
  GAME_OVER: 'GameOverScene',
  VICTORY: 'VictoryScene'
};

// Game dimensions
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

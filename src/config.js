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

// Emoji texture caching
export const EMOJI_TEXTURE = {
  CANVAS_SIZE: 96,
  FONT_SIZE: 64,
  DILATION_RADIUS: 3,
  FONT_FAMILY: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
  DISPLAY_SCALE: 1.125
};

// Spatial proximity: close beats spawn near each other
export const PROXIMITY = {
  MAX_DRIFT: 150,       // max px offset when beats are back-to-back
  FULL_RANDOM_GAP: 2.0  // seconds apart before positions are fully random
};

// Urgency indicator: outline shifts color as beat time approaches
export const URGENCY = {
  COLOR_CALM: 0xc4b5fd,   // soft lavender (far from beat)
  COLOR_URGENT: 0xf43f5e, // rose-red (imminent)
  START_PROGRESS: 0.3     // urgency tinting begins at 30% grow progress
};

// Game dimensions
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

# MojiBeats - Technical Architecture

## Tech Stack

| Layer            | Technology                     |
|-----------------|-------------------------------|
| Game Engine     | Phaser 3                       |
| Audio Analysis  | Web Audio API                  |
| Beat Detection  | Custom (spectral flux / onset) |
| UI Framework    | Phaser game objects            |
| Storage         | IndexedDB (audio), localStorage (scores) |
| Build Tool      | Vite                           |
| Language        | JavaScript (ES modules)        |
| Unit Tests      | Vitest                         |
| Browser Testing | Playwright MCP (interactive)   |
| Package Manager | npm                            |

---

## Project Structure

```
MojiBeats/
├── index.html              # Entry point
├── package.json
├── vite.config.js
├── src/
│   ├── main.js             # Phaser game config & bootstrap
│   ├── config.js           # All constants: timing, HP, scoring, emojis, theme, etc.
│   │
│   ├── assets/
│   │   └── fonts/
│   │       └── friendlyscribbles.ttf  # Handwritten theme font
│   │
│   ├── scenes/
│   │   ├── BootScene.js        # Font loading + emoji texture caching
│   │   ├── SongSelectScene.js  # Song library + upload UI + retry routing
│   │   ├── GameplayScene.js    # Main gameplay loop + pause overlay
│   │   ├── GameOverScene.js    # Game over results + retry/select
│   │   └── VictoryScene.js     # Victory results + grade + retry/select
│   │
│   ├── audio/
│   │   ├── AudioManager.js     # Audio loading, playback, Web Audio API
│   │   ├── BeatDetector.js     # Onset/beat detection from audio buffer
│   │   └── SFX.js              # Procedural sound effects (oscillator-based)
│   │
│   ├── gameplay/
│   │   ├── BeatmapGenerator.js # Converts beat timestamps → spawn events
│   │   ├── EmojiCache.js       # Pre-renders emoji + outline textures to canvas
│   │   ├── EmojiTarget.js      # Emoji enemy (grow, urgency tint, hit, miss)
│   │   ├── InputHandler.js     # Mouse + keyboard input, hit detection
│   │   ├── HealthSystem.js     # HP tracking, damage, combo heal
│   │   ├── ScoreSystem.js      # Score, combo, accuracy tracking
│   │   ├── TimingJudge.js      # Hit window evaluation (Perfect/Great/Good/Miss)
│   │   └── UrgencyColor.js     # Multi-stop gradient for outline urgency tint
│   │
│   ├── effects/
│   │   ├── BackgroundReactive.js   # Music-reactive pulse + notebook grid + doodles
│   │   ├── NotebookBackground.js   # Shared notebook grid + emoji doodle rendering
│   │   ├── ComboText.js            # Floating combo counter near kill
│   │   ├── Confetti.js             # Victory confetti shower
│   │   ├── HealthBleed.js          # Health bar bleed particles on miss
│   │   ├── PageFlip.js             # Page-flip scene transitions
│   │   ├── ParticleBurst.js        # Kill effect — emoji disintegration particles
│   │   └── PerfectFlash.js         # Light confetti on perfect hits
│   │
│   ├── ui/
│   │   ├── HealthBar.js        # Health bar rendering + damage/heal effects
│   │   └── StickyNote.js       # Sticky note song card (select, play, delete)
│   │
│   └── storage/
│       ├── SongLibrary.js      # IndexedDB CRUD for audio files + metadata
│       └── ScoreStore.js       # localStorage for scores, grades, best combos
│
├── tests/
│   └── unit/                   # Vitest: pure function tests
│       ├── BeatDetector.test.js
│       ├── BeatmapGenerator.test.js
│       ├── EmojiCache.test.js
│       ├── HealthSystem.test.js
│       ├── Proximity.test.js
│       ├── ScoreStore.test.js
│       ├── ScoreSystem.test.js
│       ├── SongLibrary.test.js
│       ├── TimingJudge.test.js
│       └── UrgencyColor.test.js
│
├── CLAUDE.md                   # AI assistant instructions
├── DESIGN.md                   # Game design document
├── ARCHITECTURE.md             # This file
└── ROADMAP.md                  # Development roadmap
```

---

## Core Systems

### 1. Audio Pipeline

```
[MP3 File Upload / Drag-and-Drop]
        │
        ▼
  AudioManager.js
  - Loads audio file into AudioBuffer (Web Audio API)
  - Creates AudioContext, source nodes, analyser nodes
  - Handles playback (play, pause, stop)
  - Exposes currentTime via AudioContext for precise sync
  - Exposes real-time frequency data for reactive background
        │
        ▼
  BeatDetector.js
  - Takes AudioBuffer channel data + sample rate
  - Performs offline analysis:
    1. Compute energy in windowed frames
    2. Compute spectral flux (energy differences)
    3. Apply adaptive thresholding to find onset peaks
    4. Estimate BPM from onset intervals
  - Outputs: array of beat timestamps (seconds) + estimated BPM
        │
        ▼
  BeatmapGenerator.js
  - Takes beat timestamps + BPM + minSpacing (difficulty)
  - Filters beats by minimum spacing (Easy=0.8s, Normal=0.4s, Hard=0.2s)
  - For each beat:
    - Assigns random emoji from pool
    - Assigns position with spatial proximity (close beats → nearby positions)
    - Assigns target color (rotating through palette)
    - Calculates spawnTime = beatTime - GROW_DURATION
  - Outputs: array of spawn events
```

### 2. Game Loop (GameplayScene)

```
Per frame (requestAnimationFrame via Phaser):
  │
  ├─ Get current audio time (AudioContext.currentTime)
  │
  ├─ Trigger beat pulses on BackgroundReactive
  │
  ├─ Spawn due EmojiTargets from beatmap
  │   └─ Create emoji + outline, begin grow animation
  │
  ├─ Update active EmojiTargets
  │   ├─ Scale up toward full size
  │   ├─ Update urgency tint (lavender → purple → pink → red)
  │   ├─ Ramp outline alpha (0.5 → 1.0)
  │   └─ At full size → ring pulse (ready indicator)
  │
  ├─ Expire missed targets (past hit window)
  │   └─ Miss → damage, bleed particles, combo reset
  │
  ├─ Handle player input (InputHandler)
  │   ├─ Cursor over active emoji + key pressed?
  │   ├─ TimingJudge evaluates (Perfect/Great/Good/Miss)
  │   ├─ ScoreSystem updates score + combo
  │   ├─ ParticleBurst + ComboText effects
  │   ├─ HealthSystem heals on combo milestones
  │   └─ PerfectFlash confetti on perfect hits
  │
  ├─ Update BackgroundReactive (pulse with audio energy)
  │
  ├─ Check HealthSystem: HP <= 0 → GameOverScene
  │
  └─ Check song ended: HP > 0 → VictoryScene
```

### 3. EmojiTarget Lifecycle

```
GROWING (scale 0→1, alpha 0→1, outline lavender→red)
    │
    ▼  (reaches full size at beat time)
ACTIVE (ring pulse plays, outline fully red + opaque)
    │
    ├─── HIT → ParticleBurst + ComboText + destroy
    │
    └─── MISS (past window) → fade out + HealthBleed + destroy
```

### 4. Urgency Gradient System

The outline tint shifts through a multi-stop gradient as the emoji grows:

| Progress | Color | Meaning |
|----------|-------|---------|
| 0.0–0.3 | Lavender (#c4b5fd) | Just spawned, calm |
| ~0.55 | Purple (#9b7be8) | Growing, so-so |
| ~0.79 | Pink (#ec4899) | Getting close |
| 1.0 | Red (#f51d42) | Imminent — perfect beat moment |

Outline alpha also ramps 0.5→1.0 so imminent beats are more vivid. This makes overlapping beats visually distinguishable.

### 5. Input System

- Phaser pointer tracking for cursor position.
- Keyboard listener for SPACE, Z, and X keys.
- On keypress: find closest active emoji under cursor within hitbox radius.
- Pass to TimingJudge for window evaluation.
- Only one emoji hit per keypress (closest to cursor wins).

### 6. Storage Layer

**SongLibrary.js (IndexedDB)**
```
Database: MojiBeats
  Store: songs
    Key: auto-increment ID
    Value: {
      id, title, bpm, emoji,
      audioBlob (Blob),
      beatCount, dateAdded, playCount
    }
```

**ScoreStore.js (localStorage)**
```
Key: mojibeats_scores
Value: {
  [songId]: {
    bestScore, maxCombo, accuracy, grade
  }
}
```

### 7. Theme System

All accent colors are centralized in `config.js` under `THEME`:
- `THEME.PRIMARY` — CSS color string (#a78bfa, lavender)
- `THEME.PRIMARY_HOVER` — darker hover state (#8b5cf6)
- `THEME.PRIMARY_HEX` — Phaser hex number (0xa78bfa)

Used by: titles, buttons, combo text, countdown, particles, confetti, health bleed. Sticky note colors are separate (per-note pastel palette in `STICKY_NOTE.COLORS`).

### 8. Retry Flow

Results pass `minSpacing` through the chain so Retry replays at the same difficulty:
```
GameplayScene.getResults() → { ..., minSpacing }
    → VictoryScene / GameOverScene
        → Retry button passes { retrySongId, retryMinSpacing }
            → SongSelectScene.init() detects retry data
                → auto-calls playSavedSong(id, { minSpacing })
```

---

## Phaser Configuration

```js
{
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, SongSelectScene, GameplayScene, GameOverScene, VictoryScene]
}
```

---

## Key Technical Considerations

### Audio Sync
- Use `AudioContext.currentTime` for precise timing, NOT `Date.now()` or Phaser's clock.
- Emoji spawn time = beat timestamp - grow duration.
- All gameplay timing derived from audio, not frames.

### Performance
- Emoji textures pre-rendered to canvas at boot (EmojiCache), never during gameplay.
- Doodle emoji textures rendered to canvas once, reused across scenes.
- Particle effects use manual tweens (not Phaser particle emitter) for control.
- Object cleanup on scene transitions and BackgroundReactive.destroy().

### Emoji Rendering & Outline Generation
- At boot, for each emoji in the pool:
  1. Render emoji to off-screen canvas → Phaser texture (filled version).
  2. Extract alpha channel, dilate it, subtract original → outline border pixels.
  3. Cache both textures (filled + outline) for reuse.
- Outlines are white silhouettes tinted at runtime via `setTint()`.
- Doodle background emojis use the same canvas approach with pixel-trimming to prevent clipping.

### Browser Compatibility
- Target: modern browsers (Chrome, Firefox, Edge, Safari).
- Web Audio API: supported in all modern browsers.
- Phaser 3: broad compatibility.
- IndexedDB: supported everywhere, with ~50MB+ storage per origin.

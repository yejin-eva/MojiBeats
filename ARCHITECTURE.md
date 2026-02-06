# MojiBeats - Technical Architecture

## Tech Stack

| Layer            | Technology                     |
|-----------------|-------------------------------|
| Game Engine     | Phaser 3                       |
| Audio Analysis  | Web Audio API                  |
| Beat Detection  | Custom (spectral flux / onset) |
| UI Framework    | Phaser DOM + HTML/CSS overlays |
| Storage         | IndexedDB (audio), localStorage (scores/settings) |
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
├── public/
│   └── fonts/              # Inter font files (fallback)
├── src/
│   ├── main.js             # Phaser game config & bootstrap
│   ├── config.js           # Game constants (timing, HP, scoring, etc.)
│   │
│   ├── scenes/
│   │   ├── BootScene.js        # Asset preloading
│   │   ├── SongSelectScene.js  # Song library + upload UI
│   │   ├── GameplayScene.js    # Main gameplay loop
│   │   ├── GameOverScene.js    # Game over / results
│   │   └── VictoryScene.js     # Song complete / results
│   │
│   ├── audio/
│   │   ├── AudioManager.js     # Audio loading, playback, Web Audio API
│   │   ├── BeatDetector.js     # Onset/beat detection from audio buffer
│   │   └── YouTubeLoader.js    # YouTube audio extraction
│   │
│   ├── gameplay/
│   │   ├── BeatmapGenerator.js # Converts beat timestamps → emoji spawn events
│   │   ├── EmojiTarget.js      # Emoji enemy game object (grow, hit, miss, die)
│   │   ├── InputHandler.js     # Mouse + keyboard input, hit detection
│   │   ├── HealthSystem.js     # HP tracking, damage, heal, game over trigger
│   │   ├── ScoreSystem.js      # Score calculation, combo tracking
│   │   └── TimingJudge.js      # Hit window evaluation (Perfect/Great/Good/Miss)
│   │
│   ├── effects/
│   │   ├── ParticleBurst.js    # Kill effect — emoji disintegration particles
│   │   ├── HealthBleed.js      # Miss effect — health bar bleed particles
│   │   ├── ComboText.js        # Floating combo counter near kill
│   │   ├── HealEffect.js       # Combo heal glow on health bar
│   │   └── BackgroundReactive.js # Music-reactive background visuals
│   │
│   ├── ui/
│   │   ├── HealthBar.js        # Health bar rendering
│   │   ├── ScoreDisplay.js     # Score + accuracy HUD
│   │   ├── SongCard.js         # Song library card component
│   │   └── UploadPanel.js      # File upload + YouTube input
│   │
│   └── storage/
│       ├── SongLibrary.js      # IndexedDB CRUD for audio files
│       └── ScoreStore.js       # localStorage for scores & settings
│
├── tests/
│   └── unit/               # Vitest: pure function tests
│
├── DESIGN.md
├── ARCHITECTURE.md
├── CLAUDE.md
└── ROADMAP.md
```

---

## Core Systems

### 1. Audio Pipeline

```
[MP3 File / YouTube URL]
        │
        ▼
  AudioManager.js
  - Loads audio file into AudioBuffer (Web Audio API)
  - Creates AudioContext, source nodes, analyser nodes
  - Handles playback (play, pause, stop, seek)
  - Exposes real-time frequency data for reactive background
        │
        ▼
  BeatDetector.js
  - Takes AudioBuffer as input
  - Performs offline analysis:
    1. Split audio into frames (window size ~1024 samples)
    2. Compute FFT per frame → spectral data
    3. Compute spectral flux (difference between consecutive frames)
    4. Apply thresholding to find onset peaks
    5. Estimate BPM from onset intervals
    6. Quantize onsets to BPM grid
  - Outputs: array of beat timestamps (in seconds)
        │
        ▼
  BeatmapGenerator.js
  - Takes beat timestamps + play area dimensions
  - For each beat:
    - Assigns a random emoji from the emoji pool
    - Assigns a random position (avoiding edges, HUD, recent positions)
    - Assigns a target color (rotating through palette)
    - Calculates spawn time = beat time - grow duration
  - Outputs: Beatmap object (array of spawn events)
```

### 2. Game Loop (GameplayScene)

```
Per frame (requestAnimationFrame via Phaser):
  │
  ├─ Get current audio time
  │
  ├─ Check beatmap for emojis that should spawn now
  │   └─ Spawn EmojiTarget at position, begin grow animation
  │
  ├─ Update active EmojiTargets
  │   ├─ Scale up toward perfect size
  │   ├─ If past hit window → trigger miss
  │   └─ If at perfect size → show ring pulse (ready indicator)
  │
  ├─ Check for player input (InputHandler)
  │   ├─ Is cursor over an active emoji?
  │   ├─ Is key pressed (Z/X)?
  │   ├─ Is emoji within hit window?
  │   │   ├─ YES → TimingJudge evaluates (Perfect/Great/Good)
  │   │   │        ScoreSystem updates, combo increments
  │   │   │        ParticleBurst plays, ComboText spawns
  │   │   │        HealthSystem heals if combo milestone
  │   │   └─ NO  → Too early, ignore input
  │   └─ No emoji under cursor → ignore input
  │
  ├─ Update effects (particles, combo text, bleeds)
  │
  ├─ Update BackgroundReactive (pulse with audio data)
  │
  ├─ Check HealthSystem
  │   └─ If HP <= 0 → transition to GameOverScene
  │
  └─ Check if song ended
      └─ If yes and HP > 0 → transition to VictoryScene
```

### 3. EmojiTarget Lifecycle

```
SPAWNED (invisible, scale=0)
    │
    ▼  (growing over ~1.0-1.5 seconds)
GROWING (scaling up, increasing opacity)
    │
    ▼  (reaches target size at beat time)
ACTIVE (at perfect size, ring pulse plays)
    │
    ├─── HIT → ParticleBurst + ComboText + destroy
    │
    └─── MISS (window passed) → ShootAtHealthBar + FadeIntoBg + destroy
```

### 4. Input System

- Phaser's built-in pointer tracking for cursor position.
- Keyboard listener for Z and X keys.
- On keydown:
  - Check all active EmojiTargets.
  - Find the one closest to cursor (within hitbox radius).
  - Pass to TimingJudge for window evaluation.
- Hitbox: based on the emoji's silhouette outline bounding box.
- Only one emoji can be hit per keypress (closest to cursor wins).

### 5. Storage Layer

**SongLibrary.js (IndexedDB)**
```
Database: MojiBeats
  Store: songs
    Key: auto-increment ID
    Value: {
      id, title, artist, bpm,
      audioBlob (Blob),
      emoji (random assigned icon),
      dateAdded, playCount
    }
```

**ScoreStore.js (localStorage)**
```
Key: mojibeats_scores
Value: {
  [songId]: {
    bestScore, bestCombo, bestAccuracy, grade, plays
  }
}

Key: mojibeats_settings
Value: {
  keyBind1: 'z',
  keyBind2: 'x',
  musicVolume: 0.8,
  sfxVolume: 0.6,
  growDuration: 1.2
}
```

---

## Phaser Configuration

```js
const config = {
    type: Phaser.AUTO,          // WebGL with Canvas fallback
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#0a0a0f',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, SongSelectScene, GameplayScene, GameOverScene, VictoryScene]
};
```

---

## Key Technical Considerations

### Audio Sync
- Use `AudioContext.currentTime` for precise timing, NOT `Date.now()` or Phaser's clock.
- Schedule emoji spawns relative to audio start time.
- Account for audio decode latency on first play.

### Performance
- Particle effects use Phaser's built-in particle emitter (GPU-accelerated).
- Limit max active particles (~200 at a time).
- Object pooling for EmojiTargets and particles to reduce GC pressure.
- Emoji rendering: render emoji text to Phaser textures on boot, reuse cached textures.

### YouTube Audio
- YouTube audio extraction requires a backend proxy or third-party API.
- Options to evaluate:
  - Server-side: lightweight proxy that extracts audio stream URL.
  - Client-side: limited options due to CORS.
- For v1: may defer YouTube support and focus on MP3 upload.
- Placeholder: YouTubeLoader.js with interface ready, implementation TBD.

### Browser Compatibility
- Target: modern browsers (Chrome, Firefox, Edge, Safari).
- Web Audio API: supported in all modern browsers.
- Phaser 3: broad compatibility.
- IndexedDB: supported everywhere, with ~50MB+ storage per origin.

### Emoji Rendering & Outline Generation
- System emojis vary across OS/browser.
- At boot, for each emoji in the pool:
  1. Render emoji text to an off-screen canvas → create a Phaser texture (the "filled" version).
  2. Extract the alpha channel from the canvas pixel data.
  3. Generate an **outline texture** by edge-detecting the alpha (dilate alpha → subtract original → left with border pixels only).
  4. Tint the outline with the assigned target color (pink, purple, blue, green, etc.).
  5. Cache both textures (filled + outline) for reuse during gameplay.
- The outline is the **emoji's own silhouette shape**, not a generic circle.
- This also enables pixel color sampling for the particle disintegration effect.

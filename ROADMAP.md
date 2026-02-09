# MojiBeats - Development Roadmap

## Phase Overview

| Phase | Name                    | Status | Goal                                        |
|-------|------------------------|--------|---------------------------------------------|
| 1     | Foundation             | Done   | Phaser setup, project scaffold, basic scene flow |
| 2     | Audio Engine           | Done   | MP3 loading, playback, beat detection        |
| 3     | Core Gameplay          | Done   | Emoji targets, input, timing, basic hit/miss |
| 4     | Combat & Health        | Done   | Health system, damage, combo healing, game over |
| 5     | Visual Effects         | Done   | Particle burst, bleed, combo text, reactive bg |
| 6     | Song Library           | Done   | IndexedDB storage, upload flow, song select UI |
| 7     | Polish & Juice         | Done   | Animations, transitions, scoring, grade system |
| 8     | YouTube Support        | Done   | Play songs from YouTube URLs via IFrame API   |
| 9     | Beat Detection v2      | Done   | Comb filter BPM, dual-band flux, per-difficulty sensitivity |
| 10    | Spatial & Scoring      | Done   | Wandering path positioning, per-difficulty scores |

---

## Phase 1: Foundation

**Goal**: Get a running Phaser app with navigable scenes.

- [x] Initialize project with Vite + npm
- [x] Install Phaser 3
- [x] Create project folder structure (`src/scenes/`, `src/audio/`, etc.)
- [x] Set up `main.js` with Phaser config
- [x] Create `config.js` with game constants
- [x] Implement `BootScene` — font preloading and emoji texture caching
- [x] Implement `SongSelectScene` — notebook-themed layout
- [x] Implement `GameplayScene` — full gameplay scene
- [x] Implement `GameOverScene` — results with animated stats
- [x] Implement `VictoryScene` — celebratory results screen
- [x] Verify scene transitions work (song select → gameplay → game over/victory)

---

## Phase 2: Audio Engine

**Goal**: Load an MP3, play it, and detect beats.

- [x] Implement `AudioManager.js`
  - [x] Load MP3 file from user input into AudioBuffer
  - [x] Play / pause / stop controls
  - [x] Expose `currentTime` for frame-accurate sync
  - [x] Create AnalyserNode for real-time frequency data
- [x] Implement `BeatDetector.js`
  - [x] Offline audio analysis (FFT, spectral flux)
  - [x] Onset detection with adaptive thresholding
  - [x] BPM estimation
  - [x] Output: array of beat timestamps
- [x] Implement `SFX.js`
  - [x] Procedural hit, miss, and combo sounds via Web Audio oscillators

---

## Phase 3: Core Gameplay

**Goal**: Emojis appear on beat, player can click them.

- [x] Implement `BeatmapGenerator.js`
  - [x] Convert beat timestamps to spawn events
  - [x] Random position assignment with spatial proximity (close beats spawn near each other)
  - [x] Random emoji + color assignment
  - [x] Configurable minimum spacing (difficulty-driven)
- [x] Implement `EmojiTarget.js`
  - [x] Grow animation (scale 0 → 1 over grow duration)
  - [x] Canvas-rendered emoji textures with silhouette outlines (EmojiCache)
  - [x] Multi-stop urgency color gradient (lavender → purple → pink → red)
  - [x] Outline alpha ramps from 0.5 → 1.0 as beat approaches
  - [x] Ring pulse animation at perfect beat time
  - [x] State machine: GROWING → ACTIVE → HIT/MISSED
- [x] Implement `InputHandler.js`
  - [x] Track mouse position
  - [x] Listen for SPACE/Z/X keypresses
  - [x] Find nearest emoji under cursor
  - [x] Trigger hit evaluation
- [x] Implement `TimingJudge.js`
  - [x] Evaluate timing offset → Perfect / Great / Good / Miss

---

## Phase 4: Combat & Health

**Goal**: The game fights back. Health system creates win/lose conditions.

- [x] Implement `HealthSystem.js`
  - [x] HP tracking (0-100)
  - [x] Take damage on miss (7 HP)
  - [x] Heal on combo milestones (5 HP every 10 combo)
  - [x] Game over trigger (HP <= 0)
- [x] Implement `ScoreSystem.js`
  - [x] Score calculation (Perfect 300, Great 200, Good 100)
  - [x] Combo counter (increment on hit, reset on miss)
  - [x] Weighted accuracy tracking by judgment tier
  - [x] Track max combo
- [x] Implement `HealthBar.js` (UI component)
  - [x] Gradient fill bar at top center
  - [x] Animate width changes smoothly
  - [x] Visual damage flash and heal glow

---

## Phase 5: Visual Effects

**Goal**: Make it feel satisfying and pretty.

- [x] Implement `ParticleBurst.js` — emoji shatters into particles on hit
- [x] Implement `HealthBleed.js` — particles drip from health bar on miss
- [x] Implement `ComboText.js` — floating "COMBO xN" near killed emoji
- [x] Implement `BackgroundReactive.js` — music-reactive purple pulse on notebook grid
- [x] Implement `NotebookBackground.js` — shared notebook grid + emoji doodle backgrounds
- [x] Implement `Confetti.js` — victory confetti shower
- [x] Implement `PerfectFlash.js` — light confetti on perfect hits
- [x] Implement `PageFlip.js` — page-flip scene transitions
- [x] Ring pulse animation on emoji at perfect beat time

---

## Phase 6: Song Library

**Goal**: Persistent song storage and polished song select screen.

- [x] Implement `SongLibrary.js`
  - [x] IndexedDB setup (create/open database)
  - [x] Save uploaded MP3 (blob + metadata)
  - [x] List all saved songs
  - [x] Delete song
  - [x] Increment play count
- [x] Implement `ScoreStore.js`
  - [x] Save best score / combo / accuracy / grade per song
  - [x] Grade calculation (S/A/B/C/D based on weighted accuracy)
- [x] Polish `SongSelectScene`
  - [x] Sticky note song library (StickyNote.js component)
  - [x] MP3 drag-and-drop upload
  - [x] File picker fallback
  - [x] Song details on hover (BPM, best score, grade)
  - [x] Delete song from sticky note
  - [x] Bouncing 🎵 loading spinner during analysis

---

## Phase 7: Polish & Juice

**Goal**: Everything feels finished and cohesive.

- [x] Page-flip scene transitions
- [x] Animated stat counters on results screens (count up from 0)
- [x] Grade system (S/A/B/C/D) with weighted accuracy
- [x] Retry button replays same song at same difficulty
- [x] Difficulty selection (Easy / Normal / Hard via minSpacing)
- [x] Lavender theme (centralized `THEME` constant)
- [x] Multi-stop urgency gradient (lavender → purple → pink → red)
- [x] Background emoji doodles on all scenes (canvas-rendered, no clipping)
- [x] Pause overlay (ESC to pause/resume, quit to menu)
- [x] SFX (hit, miss, combo milestone via Web Audio oscillators)
- [x] Loading spinner during song analysis
- [x] Responsive scaling (Phaser Scale.FIT)

---

## Phase 8: YouTube Support

**Goal**: Play songs from YouTube URLs using IFrame Player API.

- [x] Implement `YouTubePlayer.js`
  - [x] Lazy-load YouTube IFrame API via script tag
  - [x] Duck-typed AudioManager interface (play, pause, stop, getCurrentTime, getDuration, getFrequencyData, playing)
  - [x] Interpolated `getCurrentTime()` for sub-frame precision despite YouTube's ~200ms poll interval
  - [x] Hidden `<div>` player (`position: absolute; left: -9999px`)
  - [x] `extractVideoId(url)` parses youtube.com/watch, youtu.be, /embed/ formats
- [x] Implement `generateYouTubeBeats(bpm, duration)` in BeatmapGenerator
  - [x] Evenly-spaced beats at BPM intervals (no audio analysis)
- [x] Integrate with SongSelectScene
  - [x] YouTube URL input field with "Paste YouTube URL..." placeholder
  - [x] BPM input dialog (default 120)
  - [x] Save YouTube songs to IndexedDB (`type: 'youtube'`, `youtubeVideoId`, no audioBlob)
  - [x] YouTube songs show 🎬 badge on sticky notes
- [x] GameplayScene works unchanged via duck typing
  - [x] Pause/resume, song end detection, retry all work automatically

---

## Phase 9: Beat Detection v2

**Goal**: Higher-quality BPM estimation and per-difficulty beat sensitivity.

- [x] Comb filter BPM estimation
  - [x] 0.5 BPM resolution, 280 candidates (60–200 BPM), 8 phase offsets per candidate
  - [x] Parabolic interpolation for sub-step precision
  - [x] Octave disambiguation (prefer 75–160 BPM range)
- [x] Dual-band spectral flux
  - [x] Split into bass (<200Hz), mid (200–2kHz), high (>2kHz) bands
  - [x] BPM estimation uses bass-heavy weights (3.0, 0.3, 0.1)
  - [x] Onset detection uses balanced weights (1.5, 1.5, 0.3) so vocals count
- [x] Onset Strength Function preprocessing
  - [x] Log1p compression, 5-tap Hamming smooth, zero-mean, half-wave rectification
- [x] Phase-aligned grid generation (64 phase offsets, OSF-scored)
- [x] Per-difficulty sensitivity parameters
  - [x] `thresholdMultiplier`: controls how prominent a peak must be
  - [x] `minPeakInterval`: minimum time between detected onsets
  - [x] `useGrid`: Easy/Normal use phase-aligned grid; Hard uses raw onsets
- [x] FFT size increased from 1024 to 2048 for better frequency resolution

---

## Phase 10: Spatial & Scoring

**Goal**: Better beat positioning and per-difficulty score tracking.

- [x] Wandering path positioning
  - [x] Distance proportional to beat timing gap (`timeDelta * PX_PER_SECOND`)
  - [x] Persistent heading with random drift (±WANDER_RATE radians per step)
  - [x] Edge steering curves path toward center when near screen boundaries
  - [x] Break detection: gaps >2s jump to a random new area
  - [x] Wall bounce: overshoot reflects off boundaries to preserve intended distance
  - [x] All margins percentage-based (12% X, 19% top, 11% bottom)
- [x] Per-difficulty score tracking
  - [x] Scores stored per song per difficulty key (EASY/NORMAL/HARD)
  - [x] Sticky notes show all three difficulty scores (grade + score, or "- -" if unplayed)
  - [x] `difficultyKey` threaded through entire play → results → retry chain
  - [x] Backwards-compatible: old flat-format scores ignored gracefully

---

## Development Principles

1. **Playable at every phase**: Each phase produces something you can interact with.
2. **Gameplay first, polish later**: Get the core loop feeling right before adding effects.
3. **Test with real music**: Use actual songs throughout development, not silence or metronomes.
4. **Tune constantly**: Hit windows, HP values, grow duration — tweak these by feel.
5. **Keep it simple**: Resist adding features not in the design doc until the core is solid.

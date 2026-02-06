# MojiBeats - Development Roadmap

## Phase Overview

| Phase | Name                    | Goal                                        |
|-------|------------------------|---------------------------------------------|
| 1     | Foundation             | Phaser setup, project scaffold, basic scene flow |
| 2     | Audio Engine           | MP3 loading, playback, beat detection        |
| 3     | Core Gameplay          | Emoji targets, input, timing, basic hit/miss |
| 4     | Combat & Health        | Health system, damage, combo healing, game over |
| 5     | Visual Effects         | Particle burst, bleed, combo text, reactive bg |
| 6     | Song Library           | IndexedDB storage, upload flow, song select UI |
| 7     | Polish & Juice         | Animations, transitions, scoring, grade system |
| 8     | YouTube Support        | YouTube link audio extraction (stretch goal)  |

---

## Phase 1: Foundation

**Goal**: Get a running Phaser app with navigable scenes.

- [ ] Initialize project with Vite + npm
- [ ] Install Phaser 3
- [ ] Create project folder structure (`src/scenes/`, `src/audio/`, etc.)
- [ ] Set up `main.js` with Phaser config
- [ ] Create `config.js` with game constants
- [ ] Implement `BootScene` — minimal preload
- [ ] Implement `SongSelectScene` — placeholder layout
- [ ] Implement `GameplayScene` — empty scene with dark background
- [ ] Implement `GameOverScene` — placeholder layout
- [ ] Implement `VictoryScene` — placeholder layout
- [ ] Verify scene transitions work (song select → gameplay → game over/victory)

**Deliverable**: Clickable flow through all screens in the browser.

---

## Phase 2: Audio Engine

**Goal**: Load an MP3, play it, and detect beats.

- [ ] Implement `AudioManager.js`
  - [ ] Load MP3 file from user input into AudioBuffer
  - [ ] Play / pause / stop controls
  - [ ] Expose `currentTime` for frame-accurate sync
  - [ ] Create AnalyserNode for real-time frequency data
- [ ] Implement `BeatDetector.js`
  - [ ] Offline audio analysis (FFT, spectral flux)
  - [ ] Onset detection with adaptive thresholding
  - [ ] BPM estimation
  - [ ] Output: array of beat timestamps
- [ ] Test: upload an MP3, log detected beats to console, verify they align with the music

**Deliverable**: Upload an MP3 → console shows beat timestamps that match the actual beats.

---

## Phase 3: Core Gameplay

**Goal**: Emojis appear on beat, player can click them.

- [ ] Implement `BeatmapGenerator.js`
  - [ ] Convert beat timestamps to spawn events
  - [ ] Random position assignment (with spacing rules)
  - [ ] Random emoji + color assignment
- [ ] Implement `EmojiTarget.js`
  - [ ] Grow animation (scale 0 → 1 over grow duration)
  - [ ] Target outline rendering
  - [ ] Hit detection (cursor within radius + key pressed)
  - [ ] State machine: GROWING → ACTIVE → HIT/MISSED
- [ ] Implement `InputHandler.js`
  - [ ] Track mouse position
  - [ ] Listen for Z/X keypresses
  - [ ] Find nearest emoji under cursor
  - [ ] Trigger hit evaluation
- [ ] Implement `TimingJudge.js`
  - [ ] Evaluate timing offset → Perfect / Great / Good / Miss
- [ ] Integrate into `GameplayScene`:
  - [ ] Start audio, spawn emojis per beatmap
  - [ ] Handle input → evaluate hits
  - [ ] Basic feedback (just remove emoji on hit for now)

**Deliverable**: Play an MP3, emojis spawn and grow on beat, click them to destroy.

---

## Phase 4: Combat & Health

**Goal**: The game fights back. Health system creates win/lose conditions.

- [ ] Implement `HealthSystem.js`
  - [ ] HP tracking (0-100%)
  - [ ] Take damage on miss
  - [ ] Heal on combo milestones
  - [ ] Game over trigger (HP <= 0)
- [ ] Implement `ScoreSystem.js`
  - [ ] Score calculation (base points * combo multiplier)
  - [ ] Combo counter (increment on hit, reset on miss)
  - [ ] Track accuracy (hits / total notes)
  - [ ] Track max combo
- [ ] Implement `HealthBar.js` (UI component)
  - [ ] Gradient fill bar at top center
  - [ ] Animate width changes smoothly
- [ ] Miss behavior:
  - [ ] Emoji shoots toward health bar (tween animation)
  - [ ] Emoji fades into background
- [ ] Integrate with GameplayScene:
  - [ ] Wire miss → damage → health bar update
  - [ ] Wire combo → heal → health bar update
  - [ ] HP 0 → transition to GameOverScene
  - [ ] Song end + HP > 0 → transition to VictoryScene
- [ ] Pass score data to GameOverScene/VictoryScene

**Deliverable**: Full game loop — play, survive or die, see results.

---

## Phase 5: Visual Effects

**Goal**: Make it feel satisfying and pretty.

- [ ] Implement `ParticleBurst.js`
  - [ ] On hit: emoji shatters into pixel particles
  - [ ] Particles burst outward, fade, drift with gravity
  - [ ] Sample colors from emoji texture
- [ ] Implement `HealthBleed.js`
  - [ ] On miss impact: particles drip from health bar
  - [ ] Pink/purple bleed particles
- [ ] Implement `ComboText.js`
  - [ ] "COMBO xN" text near killed emoji
  - [ ] Float upward + fade out
  - [ ] Color matches target color
- [ ] Implement `HealEffect.js`
  - [ ] Green glow pulse on health bar
  - [ ] "+HP" floating text
- [ ] Implement `BackgroundReactive.js`
  - [ ] Radial gradient pulses on beat
  - [ ] Subtle visualizer bars at bottom
  - [ ] Intensity scales with audio energy
- [ ] Add screen shake on Perfect hits (subtle, brief)
- [ ] Ring pulse animation on emoji when at perfect size

**Deliverable**: Game looks and feels satisfying. Kills are crunchy, misses hurt.

---

## Phase 6: Song Library

**Goal**: Persistent song storage and polished song select screen.

- [ ] Implement `SongLibrary.js`
  - [ ] IndexedDB setup (create/open database)
  - [ ] Save uploaded MP3 (blob + metadata)
  - [ ] List all saved songs
  - [ ] Delete song
- [ ] Implement `ScoreStore.js`
  - [ ] Save best score / combo / accuracy per song
  - [ ] Load scores for display
- [ ] Polish `SongSelectScene`
  - [ ] Render song cards from library data
  - [ ] MP3 drag-and-drop upload
  - [ ] File picker fallback
  - [ ] Show BPM on card (from beat detection)
  - [ ] Show best score on card
  - [ ] Delete song option
- [ ] Upload flow:
  - [ ] User uploads MP3 → detect beats → save to library → show in list
  - [ ] Select song → start gameplay

**Deliverable**: Full upload → save → replay flow working.

---

## Phase 7: Polish & Juice

**Goal**: Everything feels finished and cohesive.

- [ ] Scene transitions (fade in/out between screens)
- [ ] Polish GameOverScene
  - [ ] Animated stat counters (count up from 0)
  - [ ] Grade calculation (S/A/B/C/D)
  - [ ] Retry button → replay same song
  - [ ] Song Select button → back to library
- [ ] Polish VictoryScene
  - [ ] Same as game over but celebratory
  - [ ] Confetti / celebration particles
- [ ] Add subtle SFX (hit sound, miss sound, combo milestone sound)
  - [ ] Use Web Audio API oscillator or short audio clips
- [ ] Settings: key rebinding, volume controls
- [ ] Responsive scaling (Phaser Scale.FIT)
- [ ] Loading states (while analyzing audio)
- [ ] Beatmap difficulty & balancing
  - [ ] Filter onsets to BPM grid (quarter notes as base)
  - [ ] Selectively add strong off-beat onsets for variety
  - [ ] Enforce minimum spacing between spawn events
  - [ ] Energy-based threshold (keep strongest N% of peaks)
  - [ ] Difficulty curve: ramp density over the song
- [ ] Edge case handling:
  - [ ] Very short songs
  - [ ] Songs with no detectable beats
  - [ ] Very fast BPM (cap note density)

**Deliverable**: Release-ready polished game.

---

## Phase 8: YouTube Support (Stretch)

**Goal**: Play songs directly from YouTube links.

- [ ] Research YouTube audio extraction options
  - [ ] Evaluate: server-side proxy vs third-party API
  - [ ] CORS and legal considerations
- [ ] Implement `YouTubeLoader.js`
  - [ ] Accept YouTube URL
  - [ ] Extract/fetch audio stream
  - [ ] Decode to AudioBuffer
- [ ] Integrate with SongSelectScene
  - [ ] YouTube URL input field
  - [ ] Loading state while fetching
  - [ ] Save to library after first play
- [ ] Test with various YouTube links

**Deliverable**: Paste a YouTube link → play the song as a rhythm game.

---

## Development Principles

1. **Playable at every phase**: Each phase produces something you can interact with.
2. **Gameplay first, polish later**: Get the core loop feeling right before adding effects.
3. **Test with real music**: Use actual songs throughout development, not silence or metronomes.
4. **Tune constantly**: Hit windows, HP values, grow duration — tweak these by feel.
5. **Keep it simple**: Resist adding features not in the design doc until the core is solid.

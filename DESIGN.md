# MojiBeats - Game Design Document

## Overview

MojiBeats is a browser-based rhythm game inspired by osu! where players fight emoji enemies by clicking them in time with the music. Beatmaps are procedurally generated from any uploaded MP3 — upload a song and play instantly.

## Core Concept

- Emojis are enemies. The music summons them.
- You are the defender. Click emojis on beat to destroy them.
- Miss the beat and the emoji attacks you, draining your health.
- Survive the entire song to win.

---

## Gameplay Mechanics

### Emoji Spawning & Timing

- Emojis spawn at **random positions** on the play area (with spatial proximity — close beats spawn near each other).
- Each emoji is tied to a **beat** in the music (detected via audio analysis).
- On spawn, the emoji is **invisible/tiny** and **grows gradually** toward its full size.
- The emoji reaches **perfect size exactly on the beat** — this is the **hit window**.
- A **target outline** (the emoji's own silhouette shape, not a circle) shows the final form the emoji will fill. The outline is rendered by extracting the emoji's alpha channel edge at boot time.
- The growth acts as the timing indicator (replaces osu!'s shrinking approach circle).

### Urgency Gradient

As each emoji grows, its outline shifts through a multi-stop color gradient to indicate timing urgency:

| Progress | Color | Visual Cue |
|----------|-------|------------|
| 0–30% | Lavender | Just spawned, calm |
| ~55% | Purple | Growing, so-so |
| ~80% | Pink | Getting close |
| 100% | Red | Imminent — hit now! |

The outline also becomes more opaque (0.5 → 1.0 alpha) as the beat approaches, making imminent beats visually prominent even when overlapping.

### Input

- **Mouse + Keyboard** (osu!-style PC controls):
  - Move cursor to hover over the emoji.
  - Press a keyboard key (`SPACE`, `Z`, or `X`) to "shoot" it.
- The hit must occur **within the hit window** (a time range around the perfect beat moment).
- Hitting **too early** (emoji still small, outside window) = no effect, nothing happens.
- Hitting **too late** or **not at all** = miss.

### Hit Windows

| Timing       | Range (ms from perfect) | Result         |
|-------------|------------------------|----------------|
| Perfect     | ±50ms                  | Full score, full combo |
| Great       | ±130ms                 | Reduced score, combo continues |
| Good        | ±200ms                 | Minimal score, combo continues |
| Miss        | >200ms or no input     | No score, combo breaks, take damage |

### Health System

- Player has a **health bar** displayed at **top center** of screen.
- Starting HP: 100.
- **On miss**: Health bar takes damage (7 HP per miss).
  - The health bar visually "bleeds" with particle effects (lavender/purple particles dripping down).
  - The missed emoji fades out.
- **On combo**: Sustained combos **heal** the player.
  - Every 10 consecutive hits restores 5 HP.
- **HP reaches 0**: Game over. The song stops.

### Combo System

- Each successful hit increments the combo counter.
- **Combo text** (e.g., "7x combo") appears **near the killed emoji** at a slight random offset.
- Combo text floats upward and fades out.
- Missing a note **resets the combo** to 0.
- Combo milestones (every 10x) trigger HP heal + SFX.

### Scoring

- Base score per hit depends on timing:
  - Perfect: 300 pts
  - Great: 200 pts
  - Good: 100 pts
  - Miss: 0 pts
- Final score displayed on results screen.
- Accuracy is weighted by judgment tier (Perfect > Great > Good) to reflect hit quality.

### Difficulty

Three difficulty levels selectable per song from the sticky note UI:

| Difficulty | Min Spacing | Threshold | Min Peak Interval | Grid | Color |
|-----------|------------|-----------|-------------------|------|-------|
| Easy | 0.8s | 2.2x | 0.3s | Yes | Green |
| Normal | 0.4s | 1.8x | 0.15s | Yes | Yellow |
| Hard | 0.2s | 1.0x | 0.1s | No | Red |

Higher difficulty = lower threshold (detects more onsets) + tighter spacing + no grid (Hard uses raw onsets for maximum density).

---

## Visual Design

### Art Style

- **Notebook / sticker theme** — the game looks like a notebook page covered in emoji stickers.
- **Background**: Off-white (#f8f8f8) with a faint light-blue grid and a single light-red margin line, like ruled notebook paper.
- **Scattered emoji doodles**: Faint music-themed emojis (🎵🎶🎸🎤🎹⭐🎧🎺🎻🥁) scattered across all scene backgrounds at low opacity (0.2), rendered via canvas textures to avoid clipping.
- **Font**: "Friendly Scribbles" — a handwritten-style font used for all UI text.
- **Theme color**: Lavender (#a78bfa) — centralized as `THEME` constant for titles, buttons, combo text, countdown, and particles.
- Light pastel palette throughout. No dark backgrounds.

### Emoji Enemies

- Different emojis appear per beat for visual variety.
- Emoji pool: `👾 👻 🤖 😈 🎃 💀 👹 🐉 🦠 👽 🔥 💣 ☠️ 🕷️ 🦇`
- Emojis are purely cosmetic — no gameplay difference between them.
- Each emoji gets a **colored silhouette outline** in the shape of that specific emoji — not a generic circle.
- Outlines are pre-rendered at boot by extracting and dilating the emoji's alpha channel.

### Kill Effect (Particle Disintegration)

- On hit, the emoji **shatters into tiny pixel particles**.
- Particles burst outward in all directions.
- Particle colors include the target color + the theme lavender.
- Particles drift with slight gravity, fading out as they scatter.

### Perfect Hit Effect

- Light confetti falls briefly from the top of the screen on perfect hits.

### Miss Effect

- The missed emoji **fades out**.
- The health bar **bleeds** — small particles drip/scatter downward.

### Health Bar

- Position: **top center**.
- Gradient fill with animated width changes.
- On damage: bleed particles + brief red flash.
- On heal: green glow pulse.

### Background (Gameplay)

- **Notebook paper**: off-white base with faint light-blue grid lines (horizontal and vertical, ~28px spacing) and a single light-red margin line.
- **Emoji doodles**: faint scattered music emojis behind the grid on all screens.
- **Reactive to music**: a subtle purple radial pulse breathes with the beat, overlaid on the notebook grid.
- The notebook grid is static and always visible; only the pulse reacts to audio energy.

### Combo Counter

- Appears near the killed emoji (random slight offset from emoji position).
- Shows "{N}x combo" in theme lavender.
- Floats upward and fades out.

---

## Screens

### 1. Song Select

- **Notebook background** matching the game's notebook theme (grid lines, margin line, emoji doodles).
- **Title**: "MojiBeats" in handwritten font (lavender).
- **Upload button**: "Upload MP3" button (gray). Also supports drag-and-drop.
- **Loading spinner**: Bouncing 🎵 emoji appears during audio loading and beat analysis.
- **Sticky note song library**: Previously uploaded songs appear as overlapping **sticky notes** fanned at the bottom of the screen.
  - Each note has a random pastel color (yellow, pink, blue, green, purple), the song's emoji, and truncated title.
  - **Collapsed**: notes overlap in a fan layout at the bottom.
  - **Peeked** (on hover): note slides up, revealing BPM and per-difficulty scores (grade + score for each played difficulty, "- -" for unplayed).
  - **Selected** (on click): note lifts to center, scales up, shows difficulty buttons (Easy/Normal/Hard) and a delete button.
  - Clicking empty space deselects all notes.
  - Up to 6 most recent songs shown.
- Songs persisted in IndexedDB (MP3 blob + metadata). Best scores in localStorage.
- **Retry routing**: When arriving from Retry, automatically loads and plays the same song at the same difficulty.

### 2. Gameplay

- **HUD elements**:
  - Health bar: top center
  - Score: top right (amber)
  - Combo counter: top right below score (lavender)
  - Song title: top left
  - Controls hint: bottom center
- **Pause**: ESC toggles pause overlay with Resume and Quit to Menu buttons.
- **Countdown**: 3-2-1 countdown in lavender before song starts.

### 3. Game Over

- **Notebook background** with grid lines and emoji doodles.
- Emoji row: `😵 💥 🎮`
- "Game Over" title (red)
- Subtitle: "The emojis got you this time..."
- Animated stats: Score, Max Combo, Accuracy (count up from 0)
- Buttons: Retry (lavender, replays same song+difficulty), Song Select (gray)

### 4. Victory Screen

- **Notebook background** with grid lines, emoji doodles, and confetti shower.
- Emoji row: `🎉 🏆 ✨`
- Title: "Song Complete!" (green)
- Grade system: S / A / B / C / D based on weighted accuracy (bounces in).
- Animated stats: Score, Max Combo, Accuracy
- Buttons: Retry (lavender, replays same song+difficulty), Song Select (gray)

---

## Audio & Beatmap Generation

### Audio Sources

1. **MP3 Upload**: User uploads an MP3 file (button or drag-and-drop). File is stored in IndexedDB for replay.
2. **YouTube URL**: User pastes a YouTube link. Video plays via IFrame API (hidden player). User provides BPM (default 120). Beats are evenly spaced at BPM intervals — no audio analysis (YouTube doesn't expose raw audio data).

### Procedural Beatmap Generation (MP3)

- Uses **Web Audio API** for offline audio analysis.
- Beat/onset detection pipeline:
  1. Decode audio to raw PCM data.
  2. Compute spectral flux in three frequency bands: bass (<200Hz), mid (200–2kHz), high (>2kHz).
  3. For BPM estimation: use bass-heavy flux (weights 3.0/0.3/0.1) to focus on rhythm, not vocals.
  4. Comb filter BPM: test 280 candidates (60–200 BPM at 0.5 steps), 8 phase offsets each, parabolic interpolation. Octave disambiguation prefers 75–160 range.
  5. For onset detection: use balanced flux (weights 1.5/1.5/0.3) so vocals and melodic hits count.
  6. Apply adaptive thresholding + peak picking to find onsets.
  7. Phase-aligned grid: 64 phase candidates, scored by onset strength function, filtered to only keep grid beats near actual onsets. Hard mode skips the grid and uses raw onsets.
- Each detected beat becomes an emoji spawn point.
- Beats are filtered by minimum spacing (configurable per difficulty level).
- Sensitivity parameters (threshold multiplier, min peak interval, grid usage) scale per difficulty.

### Beatmap Generation (YouTube)

- Beats are generated at even BPM intervals: `for t = interval; t < duration - 1; t += interval`.
- No audio analysis — relies on user-provided BPM.
- Feeds into the same `generateBeatmap()` pipeline for positioning and filtering.

### Beat Positioning

- **Wandering path**: beats spawn along a persistent heading that drifts randomly each step.
- Distance between consecutive beats is proportional to their time gap (`timeDelta * PX_PER_SECOND`), capped at `MAX_STEP`.
- **Edge steering**: when near screen boundaries, heading curves toward center.
- **Break detection**: gaps >2 seconds jump to a random new area.
- **Wall bounce**: overshoot past boundaries reflects back inward, preserving the intended timing-proportional distance.
- All margins are percentage-based (12% horizontal, 19% top, 11% bottom).

---

## Audio & Timing

- All timing is relative to `AudioContext.currentTime` — never `Date.now()` or Phaser's clock.
- Emoji spawn time = beat timestamp - grow duration (1.2 seconds).
- Game loop syncs with `requestAnimationFrame` but timing checks use audio context time.

---

## Persistence

- **Song library**: Uploaded MP3s stored in browser IndexedDB (blob + metadata: title, BPM, emoji, beat count, play count).
- **High scores**: Per-song, per-difficulty best score, max combo, accuracy, and grade stored in localStorage.

---

## Scene Transitions

All scene transitions use a **page flip** effect — a white overlay sweeps across the screen, matching the notebook theme.

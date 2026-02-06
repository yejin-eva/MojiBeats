# MojiBeats - Game Design Document

## Overview

MojiBeats is a browser-based rhythm game inspired by osu! where players fight emoji enemies by clicking them in time with the music. Beatmaps are procedurally generated from any audio source — upload an MP3 or paste a YouTube link and play instantly.

## Core Concept

- Emojis are enemies. The music summons them.
- You are the defender. Click emojis on beat to destroy them.
- Miss the beat and the emoji attacks you, draining your health.
- Survive the entire song to win.

---

## Gameplay Mechanics

### Emoji Spawning & Timing

- Emojis spawn at **random positions** on the play area.
- Each emoji is tied to a **beat** in the music (detected via audio analysis).
- On spawn, the emoji is **invisible/tiny** and **grows gradually** toward its full size.
- The emoji reaches **perfect size exactly on the beat** — this is the **hit window**.
- A **target outline** (the emoji's own silhouette shape, not a circle) shows the final form the emoji will fill. The outline is rendered by extracting the emoji's alpha channel edge at boot time.
- The growth acts as the timing indicator (replaces osu!'s shrinking approach circle).

### Input

- **Mouse + Keyboard** (osu!-style PC controls):
  - Move cursor to hover over the emoji.
  - Press a keyboard key (`Z` or `X`) to "shoot" it.
- The hit must occur **within the hit window** (a time range around the perfect beat moment).
- Hitting **too early** (emoji still small, outside window) = no effect, nothing happens.
- Hitting **too late** or **not at all** = miss.

### Hit Windows

| Timing       | Range (ms from perfect) | Result         |
|-------------|------------------------|----------------|
| Perfect     | +/- 30ms               | Full score, full combo |
| Great       | +/- 80ms               | Reduced score, combo continues |
| Good        | +/- 120ms              | Minimal score, combo continues |
| Miss        | > 120ms or no input    | No score, combo breaks, take damage |

> Note: Exact ms values are tunable. These are starting points.

### Health System

- Player has a **health bar** displayed at **top center** of screen.
- Starting HP: 100%.
- **On miss**: The emoji "attacks" — it shoots toward the health bar, causing damage.
  - The health bar visually "bleeds" with a particle effect (pink/purple particles dripping down).
  - The attacking emoji fades into the background after shooting.
  - Damage per miss: ~5-8% HP (tunable based on difficulty).
- **On combo**: Sustained combos **heal** the player.
  - Every N consecutive hits (e.g., every 10 combo) restores a small amount of HP.
  - A green glow + "+HP COMBO HEAL" text appears on the health bar.
- **HP reaches 0**: Game over. The song stops.

### Combo System

- Each successful hit increments the combo counter.
- **Combo text** (e.g., "COMBO x7") appears **near the killed emoji** at a slight random offset.
- Combo text floats upward and fades out.
- Missing a note **resets the combo** to 0.
- Combo milestones (10x, 25x, 50x, 100x) trigger:
  - HP heal
  - Visual flair (screen flash, extra particles, etc.)

### Scoring

- Base score per hit depends on timing:
  - Perfect: 300 pts
  - Great: 200 pts
  - Good: 100 pts
  - Miss: 0 pts
- Score multiplied by current combo count (combo acts as multiplier).
- Final score displayed on game over screen.

---

## Visual Design

### Art Style

- **Notebook / sticker theme** — the game looks like a notebook page covered in emoji stickers.
- **Background**: Off-white (#f8f8f8) with a faint light-blue grid and a single horizontal light-red margin line near the top, like ruled notebook paper.
- **Font**: "Friendly Scribbles" by @kmlgames — a handwritten-style font used for all UI text (titles, scores, judgments, countdowns) to reinforce the notebook/doodle aesthetic.
- **Emojis are stickers** — native system emojis rendered as if stuck onto notebook paper. Silhouette outlines give them a sticker-edge feel.
- Light pastel palette throughout. No dark backgrounds.

### Emoji Enemies

- Different emojis appear per beat for visual variety.
- Emoji pool examples: `👾 👻 🤖 😈 🎃 💀 👹 🐉 🦠 👽 🔥 💣 ☠️ 🕷️ 🦇`
- Emojis are purely cosmetic — no gameplay difference between them.
- Each emoji gets a **colored silhouette outline** (pink, purple, blue, green, etc.) in the shape of that specific emoji — not a generic circle.

### Kill Effect (Particle Disintegration)

- On hit, the emoji **shatters into tiny pixel particles**.
- Particles burst outward in all directions (sand/dust explosion feel).
- Particle colors are sampled from the emoji's palette.
- Particles drift with slight gravity, fading out as they scatter.
- Subtle screen shake on hit (very brief, ~50ms).

### Miss Effect

- The missed emoji **shoots a projectile toward the health bar**.
- On impact, the health bar **bleeds** — small particles drip/scatter downward from the hit point.
- The emoji that missed **fades into the background** (becomes transparent, drifts, disappears).

### Health Bar

- Position: **top center**.
- Gradient fill: pink -> purple -> blue.
- Outer glow matching the fill gradient.
- On damage: bleed particles + brief red flash.
- On heal: green glow pulse + "+HP" text.

### Background (Gameplay)

- **Notebook paper**: off-white base with faint light-blue grid lines (horizontal and vertical, ~28px spacing) and a single light-red horizontal margin line near the top.
- **Reactive to music**: a subtle purple radial pulse breathes with the beat, overlaid on the notebook grid.
- The notebook grid is static and always visible; only the pulse reacts to audio energy.

### Combo Counter

- Appears near the killed emoji (random slight offset from emoji position).
- Shows "COMBO x{N}" with a glow matching the emoji's target color.
- Floats upward and fades out over ~1 second.

---

## Screens

### 1. Song Select

- **Notebook background** matching the game's notebook theme (grid lines, margin line).
- **Title**: "MojiBeats" in handwritten font.
- **Upload button**: "Upload MP3" button centered below the title. Uploads an MP3, analyzes beats, saves to IndexedDB, and starts gameplay.
- **Sticky note song library**: Previously uploaded songs appear as overlapping **sticky notes** fanned at the bottom of the screen.
  - Each note has a random pastel color (yellow, pink, blue, green, purple), a tape strip, the song's emoji, and truncated title.
  - **Collapsed**: notes overlap in a fan layout at the bottom, showing emoji + title.
  - **Peeked** (on hover): note slides up, revealing BPM and best score details.
  - **Selected** (on click): note lifts to center, scales up, straightens, and shows a Play button.
  - Clicking empty space deselects all notes.
  - Up to 6 most recent songs are shown.
- **Two play paths**: upload a new MP3, or click a sticky note to replay a saved song.
- Songs are **persisted in IndexedDB** (MP3 blob + metadata). Best scores per song are stored in **localStorage**.
- On return from gameplay, sticky notes reflect updated best scores and grades.

### 2. Gameplay

- See Visual Design section above.
- **HUD elements**:
  - Health bar: top center
  - Score: top right
  - Now playing (song title + artist): top left
- No pause button in v1 (keep it simple). ESC to quit (returns to song select).

### 3. Game Over

- **Light pastel gradient background** (matches song select aesthetic).
- Floating emoji decorations (low opacity): `😵 💔 🎵 ✨ 🌸 💫`
- **Centered card** (frosted glass) with:
  - Emoji row: `😵 💥 🎮`
  - "Game Over" title
  - Subtitle: "The emojis got you this time..."
  - Stats: Score, Max Combo, Accuracy
  - Buttons: Retry, Song Select

### 4. Victory Screen (Song Complete)

- Similar layout to game over but celebratory.
- Emoji row: `🎉 🏆 ✨`
- Title: "Song Complete!"
- Same stats layout.
- Grade system: S / A / B / C / D based on accuracy.

---

## Audio & Beatmap Generation

### Audio Sources

1. **MP3 Upload**: User uploads an MP3 file. File is stored locally (IndexedDB or similar) for replay.
2. **YouTube Link**: User pastes a YouTube URL. Audio is extracted and loaded.

### Procedural Beatmap Generation

- Uses **Web Audio API** for audio analysis.
- Beat/onset detection pipeline:
  1. Decode audio to raw PCM data.
  2. Compute spectral flux / energy over time.
  3. Apply onset detection algorithm to find beat timestamps.
  4. Filter and quantize to the detected BPM grid.
- Each detected beat becomes an emoji spawn point.
- Spawn positions are randomized within the play area (avoiding edges and HUD).
- Difficulty scaling: more beats detected = harder map.

### Difficulty

- For v1: single difficulty (auto-generated).
- Future: difficulty presets that adjust:
  - Number of beats detected (threshold sensitivity).
  - Emoji spawn area size.
  - HP drain per miss.

---

## Audio & Timing

- All timing is relative to the audio playback position.
- Emoji spawn time = beat timestamp - grow duration.
- Grow duration: ~1.0-1.5 seconds (tunable).
- Game loop syncs with `requestAnimationFrame` but timing checks use audio context time for accuracy.

---

## Persistence

- **Song library**: Uploaded MP3s stored in browser IndexedDB.
- **High scores**: Per-song best score, max combo, best accuracy stored in localStorage.
- **Settings**: Key bindings, volume, etc. stored in localStorage.

# CLAUDE.md

Browser rhythm game. Phaser 3. Emojis as enemies. Procedural beatmaps from audio. See `DESIGN.md`, `ARCHITECTURE.md`, `ROADMAP.md`.

## Stack

Phaser 3, Vite, vanilla JS (ES modules), Web Audio API, Vitest, Playwright MCP, IndexedDB, localStorage.

## Architecture Principles

### Separate data from logic
- Pure data lives in plain objects and `src/config.js`. No behavior in data, no data in behavior.
- Game state is a plain object passed through pure functions. Scenes read state; systems mutate it through explicit APIs.
- Config is static. State is runtime. Never mix them.

### Pure functions over methods
- All scoring, timing judgment, beat detection, beatmap generation, and HP calculation are pure functions: input in, output out, no side effects.
- Phaser scene methods call pure functions and apply results. The scene is the glue, not the brain.
- If a function touches `this`, it better be a Phaser lifecycle method.

### Single responsibility, hard boundaries
- Each file does one thing. One class or one set of related pure functions per file.
- `src/audio/` never imports from `src/gameplay/`. `src/gameplay/` never imports from `src/effects/`. Dependencies flow downward:
  ```
  scenes → gameplay, effects, ui, audio
  gameplay → config
  effects → config
  audio → config
  ui → config
  storage → (standalone)
  ```
- No circular dependencies. No god objects.

### Thin scenes, fat systems
- Scenes are wiring only: create objects, subscribe to events, call systems, apply results.
- All game logic lives in `src/gameplay/` as pure functions or thin stateful wrappers.
- A scene method should be <15 lines. If it's longer, extract a system function.

### Explicit over implicit
- No magic strings. Key bindings, event names, emoji pools — everything from `config.js`.
- No hidden state. If something affects gameplay, it's in the game state object.
- No inheritance hierarchies. Composition via plain objects and functions.

### Zero allocations in the hot path
- Object pool all frequently created/destroyed objects (emoji targets, particles).
- Pre-render emoji textures and outline textures at boot. Never during gameplay.
- Cap active particles at 200. Reuse, don't recreate.

### Audio sync is the source of truth
- All timing uses `AudioContext.currentTime`. Never `Date.now()`, never `Phaser.time`.
- Emoji spawn time = beat timestamp - grow duration. Derived from audio, not frames.

## Testing

### Test-driven development
- Write the test first. Then write the minimum code to pass it. Then refactor.
- Every pure function has a unit test.
- Tests are not an afterthought. A feature without tests is not done.

### Vitest for unit tests
- Test files: `tests/unit/*.test.js`
- Cover: `TimingJudge`, `ScoreSystem`, `HealthSystem`, `BeatDetector`, `BeatmapGenerator`.
- These are pure functions — no Phaser, no DOM, no mocking needed.
- Run with `npx vitest`.

### Playwright MCP for interactive browser testing
- Use Playwright MCP to manually verify UI, visual effects, and user flows during development.
- No automated e2e test suite — Playwright MCP replaces it for this project.
- Verify visually: scene transitions, upload flow, gameplay feel, responsive scaling.

### What to test
- **Unit test (Vitest)**: scoring math, timing windows, HP damage/heal, beat detection output, beatmap generation, combo logic.
- **Interactive test (Playwright MCP)**: scene transitions, upload flow, gameplay loop, visual effects, game over trigger.
- **Don't test**: Phaser internals, particle visual appearance, exact pixel positions.

## Workflow

### Feature cycle
1. Write failing unit tests for the feature's pure logic.
2. Implement the minimum code to pass tests.
3. Wire into Phaser scene.
4. Verify in browser via Playwright MCP.
5. Run full test suite (`npx vitest`). All tests must pass.
6. Git commit. One commit per feature. Commit message describes what was added.

### Commit discipline
- Commit after every completed feature. Not before tests pass.
- Each commit is a working state. Never commit broken code.
- Commit message format: imperative, concise (e.g., "Add health system with damage and combo healing").

## Code Style

- ES modules (`import`/`export`). No CommonJS.
- One export per file. Filename matches export name.
- Functions over classes. Use classes only where Phaser requires them (scenes, game objects).
- No magic numbers — all constants in `config.js` with clear names.
- Small functions (<20 lines). If you need a comment to explain what a block does, extract it.
- No dead code. No commented-out code. No TODO comments — use the issue tracker.

## File Structure

```
src/
  main.js                # Phaser config & bootstrap
  config.js              # All constants: timing, HP, scoring, emojis, colors
  scenes/                # Phaser scenes (thin wiring)
  audio/                 # Audio load, playback, beat detection (pure analysis)
  gameplay/              # Pure game logic: timing, score, health, beatmap
  effects/               # Visual effects (particles, combo text, bleed, bg)
  ui/                    # HUD components (health bar, score display, cards)
  storage/               # IndexedDB + localStorage wrappers
tests/
  unit/                  # Vitest: pure function tests
```

## Commands

```
npm run dev              # Vite dev server
npm run build            # Production build
npx vitest               # Unit tests
```

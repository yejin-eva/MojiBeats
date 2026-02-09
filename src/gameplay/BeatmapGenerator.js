import {
  GROW_DURATION, EMOJI_POOL, TARGET_COLORS,
  GAME_WIDTH, GAME_HEIGHT, PROXIMITY
} from '../config.js';

const MARGIN_X = Math.round(GAME_WIDTH * 0.12);
const MARGIN_TOP = Math.round(GAME_HEIGHT * 0.19);
const MARGIN_BOTTOM = Math.round(GAME_HEIGHT * 0.11);
const DEFAULT_MIN_SPACING = 0.4;

export function filterBeats(beats, bpm, minSpacing = DEFAULT_MIN_SPACING) {
  if (beats.length === 0) return [];

  const beatInterval = bpm > 0 ? 60 / bpm : minSpacing;
  const snapWindow = beatInterval * 0.3;

  const gridBeats = [];
  if (bpm > 0) {
    const firstBeat = beats[0];
    const lastBeat = beats[beats.length - 1];
    for (let t = firstBeat; t <= lastBeat; t += beatInterval) {
      gridBeats.push(t);
    }
  }

  const selected = [];

  for (const beat of beats) {
    if (selected.length > 0 && beat - selected[selected.length - 1] < minSpacing) {
      continue;
    }

    if (bpm > 0) {
      let nearGrid = false;
      for (const g of gridBeats) {
        if (Math.abs(beat - g) <= snapWindow) {
          nearGrid = true;
          break;
        }
      }
      if (!nearGrid) continue;
    }

    selected.push(beat);
  }

  return selected;
}

export function computeNextPosition(prev, timeDelta, playWidth, playHeight, marginX, marginTop, heading) {
  if (!prev || timeDelta >= PROXIMITY.BREAK_GAP) {
    const pad = 0.15;
    return {
      x: marginX + playWidth * pad + Math.random() * playWidth * (1 - 2 * pad),
      y: marginTop + playHeight * pad + Math.random() * playHeight * (1 - 2 * pad),
      heading: Math.random() * Math.PI * 2
    };
  }

  const dist = Math.min(timeDelta * PROXIMITY.PX_PER_SECOND, PROXIMITY.MAX_STEP);
  const drift = (Math.random() - 0.5) * 2 * PROXIMITY.WANDER_RATE;
  let newHeading = heading + drift;

  const minX = marginX;
  const maxX = marginX + playWidth;
  const minY = marginTop;
  const maxY = marginTop + playHeight;
  const centerX = marginX + playWidth / 2;
  const centerY = marginTop + playHeight / 2;

  const edgePull = 0.25;
  const xNorm = (prev.x - centerX) / (playWidth / 2);
  const yNorm = (prev.y - centerY) / (playHeight / 2);
  const pullAngle = Math.atan2(-yNorm, -xNorm);
  const edgeProximity = Math.max(Math.abs(xNorm), Math.abs(yNorm));
  const pullStrength = Math.pow(Math.max(0, edgeProximity - 0.5) * 2, 2) * edgePull;
  newHeading = newHeading + pullStrength * angleDiff(newHeading, pullAngle);

  let nx = prev.x + Math.cos(newHeading) * dist;
  let ny = prev.y + Math.sin(newHeading) * dist;

  // Wall slide: when hitting a boundary, redirect remaining distance along the wall
  if (nx < minX || nx > maxX || ny < minY || ny > maxY) {
    const cx = Math.max(minX, Math.min(maxX, nx));
    const cy = Math.max(minY, Math.min(maxY, ny));
    const traveled = Math.hypot(cx - prev.x, cy - prev.y);
    const remaining = Math.max(0, dist - traveled);

    if (remaining > 1) {
      const perpA = newHeading + Math.PI / 2;
      const perpB = newHeading - Math.PI / 2;
      const ax = cx + Math.cos(perpA) * remaining;
      const ay = cy + Math.sin(perpA) * remaining;
      const bx = cx + Math.cos(perpB) * remaining;
      const by = cy + Math.sin(perpB) * remaining;
      const aIn = ax >= minX && ax <= maxX && ay >= minY && ay <= maxY;
      const bIn = bx >= minX && bx <= maxX && by >= minY && by <= maxY;

      if (aIn && !bIn) { nx = ax; ny = ay; newHeading = perpA; }
      else if (bIn && !aIn) { nx = bx; ny = by; newHeading = perpB; }
      else if (aIn && bIn) {
        if (Math.random() < 0.5) { nx = ax; ny = ay; newHeading = perpA; }
        else { nx = bx; ny = by; newHeading = perpB; }
      } else { nx = cx; ny = cy; }
    } else { nx = cx; ny = cy; }
  }

  nx = Math.max(minX, Math.min(maxX, nx));
  ny = Math.max(minY, Math.min(maxY, ny));

  return { x: nx, y: ny, heading: newHeading };
}

function angleDiff(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function generateYouTubeBeats(bpm, duration) {
  const interval = 60 / bpm;
  const beats = [];
  for (let t = interval; t < duration - 1; t += interval) {
    beats.push(t);
  }
  return beats;
}

export function generateBeatmap(beats, bpm, minSpacing = DEFAULT_MIN_SPACING) {
  const filtered = bpm ? filterBeats(beats, bpm, minSpacing) : beats;
  if (filtered.length === 0) return [];

  const playWidth = GAME_WIDTH - MARGIN_X * 2;
  const playHeight = GAME_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  let prev = null;
  let heading = Math.random() * Math.PI * 2;
  return filtered.map((beatTime, i) => {
    const timeDelta = prev ? beatTime - prev.beatTime : 0;
    const pos = computeNextPosition(prev, timeDelta, playWidth, playHeight, MARGIN_X, MARGIN_TOP, heading);
    heading = pos.heading;

    const event = {
      beatTime,
      spawnTime: beatTime - GROW_DURATION,
      x: pos.x,
      y: pos.y,
      emoji: EMOJI_POOL[i % EMOJI_POOL.length],
      color: TARGET_COLORS[i % TARGET_COLORS.length]
    };
    prev = event;
    return event;
  });
}

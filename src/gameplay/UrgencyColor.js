import { URGENCY } from '../config.js';

export function computeUrgencyTint(progress) {
  if (progress <= URGENCY.START_PROGRESS) return URGENCY.COLOR_CALM;
  if (progress >= 1) return URGENCY.COLOR_URGENT;

  const t = (progress - URGENCY.START_PROGRESS) / (1 - URGENCY.START_PROGRESS);
  return lerpColor(URGENCY.COLOR_CALM, URGENCY.COLOR_URGENT, t);
}

export function lerpColor(c1, c2, t) {
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return (r << 16) | (g << 8) | b;
}

import { TIMING } from '../config.js';

export const PERFECT = 'perfect';
export const GREAT = 'great';
export const GOOD = 'good';
export const MISS = 'miss';

export function judge(offsetMs) {
  const abs = Math.abs(offsetMs);
  if (abs <= TIMING.PERFECT) return PERFECT;
  if (abs <= TIMING.GREAT) return GREAT;
  if (abs <= TIMING.GOOD) return GOOD;
  return MISS;
}

import { describe, it, expect } from 'vitest';
import { lerpColor, computeUrgencyTint } from '../../src/gameplay/UrgencyColor.js';

describe('lerpColor', () => {
  it('returns c1 at t=0', () => {
    expect(lerpColor(0xff0000, 0x0000ff, 0)).toBe(0xff0000);
  });

  it('returns c2 at t=1', () => {
    expect(lerpColor(0xff0000, 0x0000ff, 1)).toBe(0x0000ff);
  });

  it('returns midpoint at t=0.5', () => {
    const result = lerpColor(0x000000, 0xffffff, 0.5);
    const r = (result >> 16) & 0xff;
    const g = (result >> 8) & 0xff;
    const b = result & 0xff;
    expect(r).toBe(128);
    expect(g).toBe(128);
    expect(b).toBe(128);
  });

  it('interpolates each channel independently', () => {
    const result = lerpColor(0xff0000, 0x00ff00, 0.5);
    const r = (result >> 16) & 0xff;
    const g = (result >> 8) & 0xff;
    const b = result & 0xff;
    expect(r).toBe(128);
    expect(g).toBe(128);
    expect(b).toBe(0);
  });
});

describe('computeUrgencyTint', () => {
  it('returns first gradient stop at progress 0', () => {
    expect(computeUrgencyTint(0)).toBe(0xc4b5fd);
  });

  it('returns first gradient stop below START_PROGRESS', () => {
    expect(computeUrgencyTint(0.1)).toBe(0xc4b5fd);
    expect(computeUrgencyTint(0.3)).toBe(0xc4b5fd);
  });

  it('returns last gradient stop at progress 1', () => {
    expect(computeUrgencyTint(1)).toBe(0xf51d42);
  });

  it('returns intermediate color at midpoint', () => {
    const result = computeUrgencyTint(0.65);
    expect(result).not.toBe(0xc4b5fd);
    expect(result).not.toBe(0xf43f5e);
  });

  it('gets progressively closer to urgent as progress increases', () => {
    const low = computeUrgencyTint(0.4);
    const mid = computeUrgencyTint(0.65);
    const high = computeUrgencyTint(0.9);
    // Red channel should increase toward urgent (0xf4)
    const rLow = (low >> 16) & 0xff;
    const rMid = (mid >> 16) & 0xff;
    const rHigh = (high >> 16) & 0xff;
    expect(rMid).toBeGreaterThan(rLow);
    expect(rHigh).toBeGreaterThan(rMid);
  });

  it('passes through purple mid-gradient', () => {
    // At ~35% through the gradient (progress ~0.545), should be near purple stop
    const result = computeUrgencyTint(0.545);
    const r = (result >> 16) & 0xff;
    const g = (result >> 8) & 0xff;
    const b = result & 0xff;
    // Purple stop is 0x9b7be8: r=155, g=123, b=232
    expect(r).toBeGreaterThan(130);
    expect(r).toBeLessThan(180);
    expect(b).toBeGreaterThan(180);
  });

  it('passes through pink before reaching red', () => {
    // At ~70% through the gradient (progress ~0.79), should be near pink stop
    const result = computeUrgencyTint(0.79);
    const r = (result >> 16) & 0xff;
    const g = (result >> 8) & 0xff;
    // Pink stop is 0xec4899: r=236, g=72, b=153
    expect(r).toBeGreaterThan(200);
    expect(g).toBeLessThan(100);
  });
});

import { describe, it, expect } from 'vitest';
import { judge, PERFECT, GREAT, GOOD, MISS } from '../../src/gameplay/TimingJudge.js';

describe('TimingJudge', () => {
  it('returns PERFECT for 0ms offset', () => {
    expect(judge(0)).toBe(PERFECT);
  });

  it('returns PERFECT within 30ms', () => {
    expect(judge(29)).toBe(PERFECT);
    expect(judge(-29)).toBe(PERFECT);
    expect(judge(30)).toBe(PERFECT);
    expect(judge(-30)).toBe(PERFECT);
  });

  it('returns GREAT between 31-80ms', () => {
    expect(judge(31)).toBe(GREAT);
    expect(judge(-31)).toBe(GREAT);
    expect(judge(80)).toBe(GREAT);
    expect(judge(-80)).toBe(GREAT);
  });

  it('returns GOOD between 81-120ms', () => {
    expect(judge(81)).toBe(GOOD);
    expect(judge(-81)).toBe(GOOD);
    expect(judge(120)).toBe(GOOD);
    expect(judge(-120)).toBe(GOOD);
  });

  it('returns MISS beyond 120ms', () => {
    expect(judge(121)).toBe(MISS);
    expect(judge(-121)).toBe(MISS);
    expect(judge(500)).toBe(MISS);
  });

  it('uses absolute value of offset', () => {
    expect(judge(-15)).toBe(judge(15));
    expect(judge(-50)).toBe(judge(50));
    expect(judge(-100)).toBe(judge(100));
  });
});

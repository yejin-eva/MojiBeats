import { describe, it, expect } from 'vitest';
import { judge, PERFECT, GREAT, GOOD, MISS } from '../../src/gameplay/TimingJudge.js';

describe('TimingJudge', () => {
  it('returns PERFECT for 0ms offset', () => {
    expect(judge(0)).toBe(PERFECT);
  });

  it('returns PERFECT within 50ms', () => {
    expect(judge(49)).toBe(PERFECT);
    expect(judge(-49)).toBe(PERFECT);
    expect(judge(50)).toBe(PERFECT);
    expect(judge(-50)).toBe(PERFECT);
  });

  it('returns GREAT between 51-130ms', () => {
    expect(judge(51)).toBe(GREAT);
    expect(judge(-51)).toBe(GREAT);
    expect(judge(130)).toBe(GREAT);
    expect(judge(-130)).toBe(GREAT);
  });

  it('returns GOOD between 131-200ms', () => {
    expect(judge(131)).toBe(GOOD);
    expect(judge(-131)).toBe(GOOD);
    expect(judge(200)).toBe(GOOD);
    expect(judge(-200)).toBe(GOOD);
  });

  it('returns MISS beyond 200ms', () => {
    expect(judge(201)).toBe(MISS);
    expect(judge(-201)).toBe(MISS);
    expect(judge(500)).toBe(MISS);
  });

  it('uses absolute value of offset', () => {
    expect(judge(-15)).toBe(judge(15));
    expect(judge(-75)).toBe(judge(75));
    expect(judge(-150)).toBe(judge(150));
  });
});

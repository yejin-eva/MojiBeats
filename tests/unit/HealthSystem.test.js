import { describe, it, expect } from 'vitest';
import {
  createHealthState,
  applyDamage,
  applyComboHeal,
  isDead
} from '../../src/gameplay/HealthSystem.js';
import { HEALTH } from '../../src/config.js';

describe('createHealthState', () => {
  it('starts at max HP', () => {
    const state = createHealthState();
    expect(state.hp).toBe(HEALTH.MAX);
  });
});

describe('applyDamage', () => {
  it('reduces HP by damage amount', () => {
    const state = createHealthState();
    const next = applyDamage(state);
    expect(next.hp).toBe(HEALTH.MAX - HEALTH.DAMAGE_PER_MISS);
  });

  it('does not go below 0', () => {
    const state = { hp: 3 };
    const next = applyDamage(state);
    expect(next.hp).toBe(0);
  });

  it('returns a new object (immutable)', () => {
    const state = createHealthState();
    const next = applyDamage(state);
    expect(next).not.toBe(state);
    expect(state.hp).toBe(HEALTH.MAX);
  });
});

describe('applyComboHeal', () => {
  it('heals when combo is at threshold', () => {
    const state = { hp: 50 };
    const next = applyComboHeal(state, HEALTH.COMBO_HEAL_THRESHOLD);
    expect(next.hp).toBe(50 + HEALTH.COMBO_HEAL_AMOUNT);
  });

  it('heals at multiples of threshold', () => {
    const state = { hp: 50 };
    const next = applyComboHeal(state, HEALTH.COMBO_HEAL_THRESHOLD * 2);
    expect(next.hp).toBe(50 + HEALTH.COMBO_HEAL_AMOUNT);
  });

  it('does not heal when combo is not at threshold', () => {
    const state = { hp: 50 };
    const next = applyComboHeal(state, HEALTH.COMBO_HEAL_THRESHOLD - 1);
    expect(next.hp).toBe(50);
  });

  it('does not exceed max HP', () => {
    const state = { hp: HEALTH.MAX - 1 };
    const next = applyComboHeal(state, HEALTH.COMBO_HEAL_THRESHOLD);
    expect(next.hp).toBe(HEALTH.MAX);
  });

  it('does not heal at combo 0', () => {
    const state = { hp: 50 };
    const next = applyComboHeal(state, 0);
    expect(next.hp).toBe(50);
  });
});

describe('isDead', () => {
  it('returns true at 0 HP', () => {
    expect(isDead({ hp: 0 })).toBe(true);
  });

  it('returns false above 0 HP', () => {
    expect(isDead({ hp: 1 })).toBe(false);
  });
});

import { HEALTH } from '../config.js';

export function createHealthState() {
  return { hp: HEALTH.MAX };
}

export function applyDamage(state) {
  return { hp: Math.max(0, state.hp - HEALTH.DAMAGE_PER_MISS) };
}

export function applyComboHeal(state, combo) {
  if (combo === 0 || combo % HEALTH.COMBO_HEAL_THRESHOLD !== 0) {
    return { hp: state.hp };
  }
  return { hp: Math.min(HEALTH.MAX, state.hp + HEALTH.COMBO_HEAL_AMOUNT) };
}

export function isDead(state) {
  return state.hp <= 0;
}

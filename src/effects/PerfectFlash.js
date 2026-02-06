import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

const CONFETTI_COLORS = [0xfbbf24, 0xff69b4, 0x9b59b6, 0x34d399, 0x3498db, 0xf97316];

export function emitPerfectConfetti(scene) {
  const count = 12;

  for (let i = 0; i < count; i++) {
    const x = Math.random() * GAME_WIDTH;
    const y = -10;
    const size = 2 + Math.random() * 3;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];

    const particle = scene.add.rectangle(x, y, size, size * 1.5, color);
    particle.setAlpha(0.7);
    particle.setAngle(Math.random() * 360);

    scene.tweens.add({
      targets: particle,
      y: y + 150 + Math.random() * 200,
      x: x + (Math.random() - 0.5) * 120,
      angle: particle.angle + (Math.random() - 0.5) * 180,
      alpha: 0,
      duration: 600 + Math.random() * 400,
      ease: 'Power1',
      onComplete: () => particle.destroy(),
    });
  }
}

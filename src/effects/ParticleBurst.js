import { THEME } from '../config.js';

const PARTICLE_COLORS = [THEME.PRIMARY_HEX, 0x9b59b6, 0x3498db, 0xfbbf24, 0x34d399, 0xe74c3c];

export function emitBurst(scene, x, y, color) {
  const count = 30;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const speed = 60 + Math.random() * 180;
    const size = 2 + Math.random() * 5;

    const pColor = Math.random() < 0.6
      ? color
      : PARTICLE_COLORS[i % PARTICLE_COLORS.length];

    const particle = scene.add.circle(x, y, size, pColor);
    particle.setAlpha(0.9);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed + 50,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 350 + Math.random() * 350,
      ease: 'Power2',
      onComplete: () => particle.destroy()
    });
  }
}

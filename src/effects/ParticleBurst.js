const PARTICLE_COLORS = [0xff69b4, 0x9b59b6, 0x3498db, 0xfbbf24, 0x34d399, 0xe74c3c];

export function emitBurst(scene, x, y, color) {
  const count = 12;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 80 + Math.random() * 120;
    const size = 3 + Math.random() * 4;

    const particle = scene.add.circle(x, y, size, color || PARTICLE_COLORS[i % PARTICLE_COLORS.length]);
    particle.setAlpha(0.9);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed + 40,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 400 + Math.random() * 200,
      ease: 'Power2',
      onComplete: () => particle.destroy()
    });
  }
}

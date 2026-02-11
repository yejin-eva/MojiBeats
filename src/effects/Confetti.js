import { GAME_WIDTH, GAME_HEIGHT, THEME, scaleW, scaleH } from '../config.js';

const COLORS = [THEME.PRIMARY_HEX, 0x7c3aed, 0x3498db, 0x2ecc71, 0xfbbf24, 0xf43f5e, 0x60a5fa, 0xa78bfa];
const COUNT = 60;

export function emitConfetti(scene) {
  for (let i = 0; i < COUNT; i++) {
    const x = Math.random() * GAME_WIDTH;
    const y = -10 - Math.random() * 100;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const size = scaleH(4) + Math.random() * scaleH(6);

    const piece = scene.add.rectangle(x, y, size, size * 1.5, color)
      .setAngle(Math.random() * 360)
      .setDepth(8000);

    scene.tweens.add({
      targets: piece,
      y: GAME_HEIGHT + 20,
      x: x + (Math.random() - 0.5) * scaleW(200),
      angle: piece.angle + (Math.random() - 0.5) * 720,
      duration: 2000 + Math.random() * 1500,
      delay: Math.random() * 600,
      ease: 'Sine.easeIn',
      onComplete: () => piece.destroy()
    });
  }
}

import { GAME_WIDTH, THEME, scaleW, scaleH } from '../config.js';

const BLEED_COLORS = [THEME.PRIMARY_HEX, 0x9b59b6, 0xc084fc];

export function emitBleed(scene) {
  const barCenterX = GAME_WIDTH / 2;
  const barY = scaleH(40);
  const count = 6;

  for (let i = 0; i < count; i++) {
    const px = barCenterX + (Math.random() - 0.5) * scaleW(200);
    const color = BLEED_COLORS[i % BLEED_COLORS.length];
    const size = scaleH(2) + Math.random() * scaleH(3);

    const drop = scene.add.circle(px, barY, size, color);
    drop.setAlpha(0.8);

    scene.tweens.add({
      targets: drop,
      y: barY + scaleH(30) + Math.random() * scaleH(40),
      x: px + (Math.random() - 0.5) * scaleW(20),
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: 500 + Math.random() * 300,
      ease: 'Power1',
      onComplete: () => drop.destroy()
    });
  }
}

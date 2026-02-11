import { scaleW, scaleH } from '../config.js';

export function showCombo(scene, x, y, combo, color) {
  if (combo < 2) return;

  const offsetX = (Math.random() - 0.5) * scaleW(40);
  const offsetY = (Math.random() - 0.5) * scaleH(20);

  const text = scene.add.text(x + offsetX, y + offsetY, `${combo}x`, {
    fontSize: `${scaleH(28)}px`,
    fontFamily: 'Arial',
    color: colorToHex(color),
    fontStyle: 'bold'
  }).setOrigin(0.5).setAlpha(0.9);

  scene.tweens.add({
    targets: text,
    y: y + offsetY - scaleH(60),
    alpha: 0,
    scaleX: 1.3,
    scaleY: 1.3,
    duration: 700,
    ease: 'Power2',
    onComplete: () => text.destroy()
  });
}

function colorToHex(color) {
  if (typeof color === 'string') return color;
  return '#' + color.toString(16).padStart(6, '0');
}

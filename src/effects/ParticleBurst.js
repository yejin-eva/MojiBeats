import { EMOJI_TEXTURE } from '../config.js';
import { getFragmentKeys, FRAGMENT_COLS, FRAGMENT_ROWS } from '../gameplay/EmojiCache.js';

export function emitBurst(scene, x, y, color, emoji) {
  const fragments = getFragmentKeys(emoji);
  const canvasSize = EMOJI_TEXTURE.CANVAS_SIZE;
  const displayScale = EMOJI_TEXTURE.DISPLAY_SCALE;
  const fragW = canvasSize / FRAGMENT_COLS;
  const fragH = canvasSize / FRAGMENT_ROWS;

  for (const { key, col, row } of fragments) {
    const localX = (col + 0.5) * fragW - canvasSize / 2;
    const localY = (row + 0.5) * fragH - canvasSize / 2;
    const screenX = x + localX * displayScale;
    const screenY = y + localY * displayScale;

    const angle = Math.atan2(localY, localX) + (Math.random() - 0.5) * 0.6;
    const speed = 42 + Math.random() * 98;

    const frag = scene.add.image(screenX, screenY, key);
    frag.setScale(displayScale);

    scene.tweens.add({
      targets: frag,
      x: screenX + Math.cos(angle) * speed,
      y: screenY + Math.sin(angle) * speed + 35,
      angle: (Math.random() - 0.5) * 180,
      alpha: 0,
      duration: 400 + Math.random() * 300,
      ease: 'Power2',
      onComplete: () => frag.destroy()
    });
  }
}

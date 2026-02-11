import { GROW_DURATION, EMOJI_TEXTURE, scaleW, scaleH } from '../config.js';
import { getEmojiTextureKey, getOutlineTextureKey } from './EmojiCache.js';
import { computeUrgencyTint } from './UrgencyColor.js';

const STATE_GROWING = 'growing';
const STATE_ACTIVE = 'active';
const STATE_HIT = 'hit';
const STATE_MISSED = 'missed';

export default class EmojiTarget {
  constructor(scene, event) {
    this.scene = scene;
    this.beatTime = event.beatTime;
    this.spawnTime = event.spawnTime;
    this.color = event.color;
    this.x = event.x;
    this.y = event.y;
    this.state = STATE_GROWING;
    this.pulsed = false;
    this.emojiChar = event.emoji;

    const outlineKey = getOutlineTextureKey(event.emoji);
    const emojiKey = getEmojiTextureKey(event.emoji);

    this.outline = scene.add.image(event.x, event.y, outlineKey)
      .setTint(computeUrgencyTint(0))
      .setAlpha(0.5)
      .setScale(EMOJI_TEXTURE.DISPLAY_SCALE);

    this.emoji = scene.add.image(event.x, event.y, emojiKey)
      .setScale(0)
      .setAlpha(0);
  }

  update(currentTime) {
    if (this.state === STATE_HIT || this.state === STATE_MISSED) return;

    const elapsed = currentTime - this.spawnTime;
    const progress = Math.min(elapsed / GROW_DURATION, 1);

    const scale = progress * EMOJI_TEXTURE.DISPLAY_SCALE;
    this.emoji.setScale(scale).setAlpha(Math.min(progress * 1.5, 1));
    this.outline.setTint(computeUrgencyTint(progress));
    this.outline.setAlpha(0.5 + progress * 0.5);

    if (progress >= 1 && this.state === STATE_GROWING) {
      this.state = STATE_ACTIVE;
      this.ringPulse();
    }
  }

  ringPulse() {
    if (this.pulsed) return;
    this.pulsed = true;

    const outlineKey = getOutlineTextureKey(this.emojiChar);
    const ring = this.scene.add.image(this.x, this.y, outlineKey)
      .setTint(this.color)
      .setScale(EMOJI_TEXTURE.DISPLAY_SCALE);

    this.scene.tweens.add({
      targets: ring,
      scaleX: EMOJI_TEXTURE.DISPLAY_SCALE * 1.8,
      scaleY: EMOJI_TEXTURE.DISPLAY_SCALE * 1.8,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    });
  }

  getOffsetMs(currentTime) {
    return (currentTime - this.beatTime) * 1000;
  }

  containsPoint(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    const radius = scaleH(36) * (this.emoji.scaleX / EMOJI_TEXTURE.DISPLAY_SCALE);
    return dx * dx + dy * dy <= radius * radius;
  }

  hit() {
    this.state = STATE_HIT;
    if (this.outline) {
      this.outline.destroy();
      this.outline = null;
    }

    if (!this.emoji) { this.destroy(); return; }

    const jerkX = (Math.random() - 0.5) * scaleW(8);
    const jerkY = -scaleH(3) + Math.random() * scaleH(2);

    this.scene.tweens.add({
      targets: this.emoji,
      scaleX: EMOJI_TEXTURE.DISPLAY_SCALE * 0.3,
      scaleY: EMOJI_TEXTURE.DISPLAY_SCALE * 0.3,
      x: this.x + jerkX,
      y: this.y + jerkY,
      duration: 80,
      ease: 'Power2',
      onComplete: () => this.destroy()
    });
  }

  miss() {
    this.state = STATE_MISSED;
    this.scene.tweens.add({
      targets: [this.emoji, this.outline],
      alpha: 0,
      duration: 300,
      onComplete: () => this.destroy()
    });
  }

  destroy() {
    if (this.emoji) this.emoji.destroy();
    if (this.outline) this.outline.destroy();
    this.emoji = null;
    this.outline = null;
  }

  get isAlive() {
    return this.state === STATE_GROWING || this.state === STATE_ACTIVE;
  }
}

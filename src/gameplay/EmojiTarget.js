import { GROW_DURATION } from '../config.js';

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

    this.outline = scene.add.circle(event.x, event.y, 36, event.color, 0.3)
      .setScale(1).setStrokeStyle(2, event.color);

    this.text = scene.add.text(event.x, event.y, event.emoji, {
      fontSize: '48px'
    }).setOrigin(0.5).setScale(0).setAlpha(0);
  }

  update(currentTime) {
    if (this.state === STATE_HIT || this.state === STATE_MISSED) return;

    const elapsed = currentTime - this.spawnTime;
    const progress = Math.min(elapsed / GROW_DURATION, 1);

    this.text.setScale(progress).setAlpha(Math.min(progress * 1.5, 1));

    if (progress >= 1 && this.state === STATE_GROWING) {
      this.state = STATE_ACTIVE;
      this.ringPulse();
    }
  }

  ringPulse() {
    if (this.pulsed) return;
    this.pulsed = true;

    const ring = this.scene.add.circle(this.x, this.y, 36, this.color, 0)
      .setStrokeStyle(3, this.color);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.8,
      scaleY: 1.8,
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
    const radius = 36 * this.text.scaleX;
    return dx * dx + dy * dy <= radius * radius;
  }

  hit() {
    this.state = STATE_HIT;
    this.destroy();
  }

  miss() {
    this.state = STATE_MISSED;
    this.scene.tweens.add({
      targets: [this.text, this.outline],
      alpha: 0,
      duration: 300,
      onComplete: () => this.destroy()
    });
  }

  destroy() {
    if (this.text) this.text.destroy();
    if (this.outline) this.outline.destroy();
    this.text = null;
    this.outline = null;
  }

  get isAlive() {
    return this.state === STATE_GROWING || this.state === STATE_ACTIVE;
  }
}

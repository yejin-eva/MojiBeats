import { KEYS } from '../config.js';

export default class InputHandler {
  constructor(scene, onHit) {
    this.scene = scene;
    this.onHit = onHit;

    this.keys = [
      scene.input.keyboard.addKey(KEYS.HIT_1),
      scene.input.keyboard.addKey(KEYS.HIT_2),
      scene.input.keyboard.addKey(KEYS.HIT_3),
      scene.input.keyboard.addKey(KEYS.HIT_4),
      scene.input.keyboard.addKey(KEYS.HIT_5)
    ];

    for (const key of this.keys) {
      key.on('down', () => this.tryHit());
    }
  }

  tryHit() {
    const pointer = this.scene.input.activePointer;
    this.onHit(pointer.worldX, pointer.worldY);
  }

  destroy() {
    for (const key of this.keys) {
      key.destroy();
    }
  }
}

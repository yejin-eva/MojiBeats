import { KEYS, TIMING } from '../config.js';

export default class InputHandler {
  constructor(scene, onHit) {
    this.scene = scene;
    this.onHit = onHit;

    this.keyZ = scene.input.keyboard.addKey(KEYS.HIT_1);
    this.keyX = scene.input.keyboard.addKey(KEYS.HIT_2);

    this.keyZ.on('down', () => this.tryHit());
    this.keyX.on('down', () => this.tryHit());
  }

  tryHit() {
    const pointer = this.scene.input.activePointer;
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    this.onHit(worldX, worldY);
  }

  destroy() {
    this.keyZ.destroy();
    this.keyX.destroy();
  }
}

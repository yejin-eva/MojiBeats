import { GAME_WIDTH, GAME_HEIGHT, NOTEBOOK } from '../config.js';

export default class BackgroundReactive {
  constructor(scene) {
    this.scene = scene;

    this.gridLines = [];

    for (let y = NOTEBOOK.GRID_SPACING; y < GAME_HEIGHT; y += NOTEBOOK.GRID_SPACING) {
      const line = scene.add.rectangle(
        GAME_WIDTH / 2, y, GAME_WIDTH, 1, NOTEBOOK.GRID_COLOR, NOTEBOOK.GRID_ALPHA
      );
      this.gridLines.push(line);
    }

    for (let x = NOTEBOOK.GRID_SPACING; x < GAME_WIDTH; x += NOTEBOOK.GRID_SPACING) {
      const line = scene.add.rectangle(
        x, GAME_HEIGHT / 2, 1, GAME_HEIGHT, NOTEBOOK.GRID_COLOR, NOTEBOOK.GRID_ALPHA
      );
      this.gridLines.push(line);
    }

    this.marginLine = scene.add.rectangle(
      NOTEBOOK.MARGIN_X, GAME_HEIGHT / 2, 2, GAME_HEIGHT, NOTEBOOK.MARGIN_COLOR, NOTEBOOK.MARGIN_ALPHA
    );

    this.pulse = scene.add.circle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, 200, 0xc4b5fd, 0
    );
  }

  update(audioManager) {
    if (!audioManager) return;

    const freqData = audioManager.getFrequencyData();
    if (freqData.length === 0) return;

    let totalEnergy = 0;
    const step = Math.floor(freqData.length / 16);
    for (let i = 0; i < 16; i++) {
      totalEnergy += (freqData[i * step] || 0) / 255;
    }

    const avgEnergy = totalEnergy / 16;
    this.pulse.setAlpha(avgEnergy * 0.06);
    this.pulse.setScale(0.8 + avgEnergy * 0.4);
  }

  onBeat() {
    this.pulse.setAlpha(0.1);
    this.scene.tweens.add({
      targets: this.pulse,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Power2'
    });
  }

  destroy() {
    this.pulse.destroy();
    this.marginLine.destroy();
    for (const line of this.gridLines) line.destroy();
    this.gridLines = [];
  }
}

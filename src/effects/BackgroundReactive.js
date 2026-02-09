import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { drawNotebookGrid, scatterDoodles } from './NotebookBackground.js';

export default class BackgroundReactive {
  constructor(scene) {
    this.scene = scene;

    const { lines, margin } = drawNotebookGrid(scene);
    this.gridLines = lines;
    this.marginLine = margin;

    this.pulse = scene.add.circle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, 200, 0xc4b5fd, 0
    );

    this.doodles = scatterDoodles(scene);
    this.doodleBaseScales = this.doodles.map(d => d.scaleX);
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

    this.doodles.forEach((doodle, i) => {
      const base = this.doodleBaseScales[i];
      doodle.setScale(base * 1.3);
      this.scene.tweens.add({
        targets: doodle,
        scaleX: base,
        scaleY: base,
        duration: 350,
        ease: 'Power2',
      });
    });
  }

  destroy() {
    this.pulse.destroy();
    this.marginLine.destroy();
    for (const line of this.gridLines) line.destroy();
    this.gridLines = [];
    for (const doodle of this.doodles) doodle.destroy();
    this.doodles = [];
  }
}

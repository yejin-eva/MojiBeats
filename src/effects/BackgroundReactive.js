import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

const NUM_BARS = 32;
const BAR_WIDTH = GAME_WIDTH / NUM_BARS;
const BAR_MAX_HEIGHT = 80;

export default class BackgroundReactive {
  constructor(scene) {
    this.scene = scene;

    this.pulse = scene.add.circle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, 200, 0xc4b5fd, 0
    );

    this.bars = [];
    for (let i = 0; i < NUM_BARS; i++) {
      const bar = scene.add.rectangle(
        i * BAR_WIDTH + BAR_WIDTH / 2,
        GAME_HEIGHT,
        BAR_WIDTH - 2,
        0,
        0xc4b5fd, 0.2
      ).setOrigin(0.5, 1);
      this.bars.push(bar);
    }
  }

  update(audioManager) {
    if (!audioManager) return;

    const freqData = audioManager.getFrequencyData();
    if (freqData.length === 0) return;

    const step = Math.floor(freqData.length / NUM_BARS);
    let totalEnergy = 0;

    for (let i = 0; i < NUM_BARS; i++) {
      const value = freqData[i * step] || 0;
      const normalized = value / 255;
      totalEnergy += normalized;

      const height = normalized * BAR_MAX_HEIGHT;
      this.bars[i].setSize(BAR_WIDTH - 2, height);
      this.bars[i].setAlpha(0.08 + normalized * 0.12);
    }

    const avgEnergy = totalEnergy / NUM_BARS;
    this.pulse.setAlpha(avgEnergy * 0.08);
    this.pulse.setScale(0.8 + avgEnergy * 0.4);
  }

  onBeat() {
    this.pulse.setAlpha(0.12);
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
    for (const bar of this.bars) bar.destroy();
    this.bars = [];
  }
}

import { GAME_WIDTH, HEALTH } from '../config.js';

const BAR_WIDTH = 400;
const BAR_HEIGHT = 20;
const BAR_X = (GAME_WIDTH - BAR_WIDTH) / 2;
const BAR_Y = 20;

export default class HealthBar {
  constructor(scene) {
    this.scene = scene;

    this.bg = scene.add.rectangle(
      BAR_X + BAR_WIDTH / 2, BAR_Y + BAR_HEIGHT / 2,
      BAR_WIDTH, BAR_HEIGHT, 0x1a1a2e
    ).setStrokeStyle(1, 0x333355);

    this.fill = scene.add.rectangle(
      BAR_X, BAR_Y,
      BAR_WIDTH, BAR_HEIGHT, 0x7c3aed
    ).setOrigin(0, 0);

    this.damageFlash = scene.add.rectangle(
      BAR_X + BAR_WIDTH / 2, BAR_Y + BAR_HEIGHT / 2,
      BAR_WIDTH, BAR_HEIGHT, 0xff0000, 0
    );

    this.hpText = scene.add.text(
      BAR_X + BAR_WIDTH / 2, BAR_Y + BAR_HEIGHT / 2, '100%', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }

  update(hp) {
    const ratio = hp / HEALTH.MAX;
    const targetWidth = BAR_WIDTH * ratio;

    this.scene.tweens.add({
      targets: this.fill,
      displayWidth: targetWidth,
      duration: 150,
      ease: 'Power2'
    });

    this.hpText.setText(`${Math.round(hp)}%`);

    if (ratio > 0.5) {
      this.fill.setFillStyle(0x7c3aed);
    } else if (ratio > 0.25) {
      this.fill.setFillStyle(0xf59e0b);
    } else {
      this.fill.setFillStyle(0xef4444);
    }
  }

  showDamage() {
    this.damageFlash.setAlpha(0.6);
    this.scene.tweens.add({
      targets: this.damageFlash,
      alpha: 0,
      duration: 200,
      ease: 'Power2'
    });
  }

  showHeal() {
    const healText = this.scene.add.text(
      BAR_X + BAR_WIDTH / 2, BAR_Y - 10, '+HP', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#34d399'
      }
    ).setOrigin(0.5);

    this.scene.tweens.add({
      targets: healText,
      y: BAR_Y - 30,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => healText.destroy()
    });
  }

  destroy() {
    this.bg.destroy();
    this.fill.destroy();
    this.damageFlash.destroy();
    this.hpText.destroy();
  }
}

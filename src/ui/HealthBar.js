import { GAME_WIDTH, HEALTH, THEME } from '../config.js';

const BAR_WIDTH = Math.round(GAME_WIDTH * 0.6);
const BAR_HEIGHT = 16;
const BAR_X = (GAME_WIDTH - BAR_WIDTH) / 2;
const BAR_Y = 14;

export default class HealthBar {
  constructor(scene) {
    this.scene = scene;

    const RADIUS = 6;

    this.bgGfx = scene.add.graphics();
    this.bgGfx.fillStyle(0xe0daf0);
    this.bgGfx.fillRoundedRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, RADIUS);
    this.bgGfx.lineStyle(1, 0xc4b5fd);
    this.bgGfx.strokeRoundedRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, RADIUS);

    this.fillGfx = scene.add.graphics();
    this.fillWidth = BAR_WIDTH;
    this.radius = RADIUS;
    this.drawFill(BAR_WIDTH, THEME.PRIMARY_HEX);

    this.damageGfx = scene.add.graphics().setAlpha(0);

    this.hpText = scene.add.text(
      BAR_X + BAR_WIDTH / 2, BAR_Y + BAR_HEIGHT / 2, '100%', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#4b5563'
      }
    ).setOrigin(0.5);
  }

  drawFill(width, color) {
    this.fillGfx.clear();
    if (width < 1) return;
    this.fillGfx.fillStyle(color);
    this.fillGfx.fillRoundedRect(BAR_X, BAR_Y, width, BAR_HEIGHT, this.radius);
  }

  update(hp) {
    const ratio = hp / HEALTH.MAX;
    const targetWidth = BAR_WIDTH * ratio;

    let color;
    if (ratio > 0.5) {
      color = THEME.PRIMARY_HEX;
    } else if (ratio > 0.25) {
      color = 0xf59e0b;
    } else {
      color = 0xef4444;
    }

    this.targetFillWidth = targetWidth;
    this.fillColor = color;
    this.scene.tweens.add({
      targets: this,
      fillWidth: targetWidth,
      duration: 150,
      ease: 'Power2',
      onUpdate: () => this.drawFill(this.fillWidth, this.fillColor),
    });

    this.hpText.setText(`${Math.round(hp)}%`);
  }

  showDamage() {
    this.damageGfx.clear();
    this.damageGfx.fillStyle(0xff0000);
    this.damageGfx.fillRoundedRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, this.radius);
    this.damageGfx.setAlpha(0.6);
    this.scene.tweens.add({
      targets: this.damageGfx,
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
    this.bgGfx.destroy();
    this.fillGfx.destroy();
    this.damageGfx.destroy();
    this.hpText.destroy();
  }
}

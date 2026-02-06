import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class GameplayScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAMEPLAY);
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0f');

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Gameplay', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Press ESC to return to Song Select', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#9ca3af'
    }).setOrigin(0.5);

    const gameOverBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, '[Test: Game Over]', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ef4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    gameOverBtn.on('pointerdown', () => this.scene.start(SCENES.GAME_OVER));

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start(SCENES.SONG_SELECT);
    });

    this.time.delayedCall(3000, () => {
      if (this.scene.isActive(SCENES.GAMEPLAY)) {
        this.scene.start(SCENES.VICTORY);
      }
    });
  }
}

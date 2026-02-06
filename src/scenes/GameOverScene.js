import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME_OVER);
  }

  init(data) {
    this.results = data || { score: 0, maxCombo: 0, accuracy: 0, songName: '' };
  }

  create() {
    this.cameras.main.setBackgroundColor('#fdf2f8');

    this.add.text(GAME_WIDTH / 2, 120, '😵 💥 🎮', {
      fontSize: '56px'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, 'Game Over', {
      fontSize: '56px',
      fontFamily: 'Arial',
      color: '#be123c'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 260, 'The emojis got you this time...', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#6b7280'
    }).setOrigin(0.5);

    const { score, maxCombo, accuracy } = this.results;

    this.add.text(GAME_WIDTH / 2, 340, `Score: ${score.toLocaleString()}`, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#374151'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 380, `Max Combo: ${maxCombo}  |  Accuracy: ${accuracy}%`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#6b7280'
    }).setOrigin(0.5);

    const retryBtn = this.add.text(GAME_WIDTH / 2 - 100, 460, 'Retry', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#7c3aed',
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => this.scene.start(SCENES.SONG_SELECT));

    const selectBtn = this.add.text(GAME_WIDTH / 2 + 120, 460, 'Song Select', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#6b7280',
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    selectBtn.on('pointerdown', () => this.scene.start(SCENES.SONG_SELECT));
  }
}

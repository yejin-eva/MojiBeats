import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super(SCENES.VICTORY);
  }

  init(data) {
    this.results = data || { score: 0, maxCombo: 0, accuracy: 0, songName: '' };
  }

  create() {
    this.cameras.main.setBackgroundColor('#f0fdf4');

    this.add.text(GAME_WIDTH / 2, 120, '🎉 🏆 ✨', {
      fontSize: '56px'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, 'Song Complete!', {
      fontSize: '56px',
      fontFamily: 'Arial',
      color: '#15803d'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 260, 'You defeated all the emojis!', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#6b7280'
    }).setOrigin(0.5);

    const { score, maxCombo, accuracy } = this.results;
    const grade = this.calculateGrade(accuracy);

    this.add.text(GAME_WIDTH / 2, 320, grade, {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: this.gradeColor(grade)
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 390, `Score: ${score.toLocaleString()}`, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#374151'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 430, `Max Combo: ${maxCombo}  |  Accuracy: ${accuracy}%`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#6b7280'
    }).setOrigin(0.5);

    const retryBtn = this.add.text(GAME_WIDTH / 2 - 100, 510, 'Retry', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#7c3aed',
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => this.scene.start(SCENES.SONG_SELECT));

    const selectBtn = this.add.text(GAME_WIDTH / 2 + 120, 510, 'Song Select', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#6b7280',
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    selectBtn.on('pointerdown', () => this.scene.start(SCENES.SONG_SELECT));
  }

  calculateGrade(accuracy) {
    if (accuracy >= 95) return 'S';
    if (accuracy >= 85) return 'A';
    if (accuracy >= 70) return 'B';
    if (accuracy >= 50) return 'C';
    return 'D';
  }

  gradeColor(grade) {
    const colors = { S: '#fbbf24', A: '#34d399', B: '#60a5fa', C: '#a78bfa', D: '#6b7280' };
    return colors[grade] || '#6b7280';
  }
}

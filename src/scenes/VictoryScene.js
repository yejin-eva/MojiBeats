import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, THEME_FONT, THEME, NOTEBOOK } from '../config.js';
import { pageFlipIn, pageFlipOut } from '../effects/PageFlip.js';
import { drawNotebookGrid, scatterDoodles } from '../effects/NotebookBackground.js';
import { emitConfetti } from '../effects/Confetti.js';
import { calculateGrade, saveScore } from '../storage/ScoreStore.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super(SCENES.VICTORY);
  }

  init(data) {
    this.results = data || { score: 0, maxCombo: 0, accuracy: 0, songName: '', songId: null, minSpacing: 0.4 };
    this.retrySongId = this.results.songId;
    this.retryMinSpacing = this.results.minSpacing || 0.4;
  }

  create() {
    this.cameras.main.setBackgroundColor(NOTEBOOK.BG_COLOR);
    pageFlipIn(this);

    drawNotebookGrid(this);
    scatterDoodles(this);
    this.time.delayedCall(500, () => emitConfetti(this));

    const { score, maxCombo, accuracy, songId } = this.results;
    const grade = calculateGrade(accuracy);

    if (songId) {
      saveScore(songId, { score, maxCombo, accuracy, grade });
    }

    this.add.text(GAME_WIDTH / 2, 120, '🎉 🏆 ✨', {
      fontSize: '56px',
      padding: { top: 8, bottom: 4 }
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, 'Song Complete!', {
      fontSize: '64px',
      fontFamily: THEME_FONT,
      color: '#15803d'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 265, 'You defeated all the emojis!', {
      fontSize: '26px',
      fontFamily: THEME_FONT,
      color: '#6b7280'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 330, grade, {
      fontSize: '80px',
      fontFamily: THEME_FONT,
      color: this.gradeColor(grade)
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: this.children.list[this.children.list.length - 1],
      scale: 1,
      duration: 600,
      delay: 400,
      ease: 'Back.easeOut'
    });

    const scoreText = this.add.text(GAME_WIDTH / 2, 400, 'Score: 0', {
      fontSize: '32px',
      fontFamily: THEME_FONT,
      color: '#374151'
    }).setOrigin(0.5);

    const comboAccText = this.add.text(GAME_WIDTH / 2, 440, 'Max Combo: 0  |  Accuracy: 0%', {
      fontSize: '24px',
      fontFamily: THEME_FONT,
      color: '#6b7280'
    }).setOrigin(0.5);

    this.animateCounter(0, score, 1200, 300, (val) => {
      scoreText.setText(`Score: ${val.toLocaleString()}`);
    });

    this.animateCounter(0, maxCombo, 800, 500, (val) => {
      comboAccText.setText(`Max Combo: ${val}  |  Accuracy: ${accuracy}%`);
    });

    this.animateCounter(0, accuracy, 800, 700, (val) => {
      comboAccText.setText(`Max Combo: ${maxCombo}  |  Accuracy: ${val}%`);
    });

    const retryBtn = this.add.text(GAME_WIDTH / 2 - 100, 520, 'Retry', {
      fontSize: '32px',
      fontFamily: THEME_FONT,
      color: '#ffffff',
      backgroundColor: THEME.PRIMARY,
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => this.fadeToScene(SCENES.SONG_SELECT, {
      retrySongId: this.retrySongId,
      retryMinSpacing: this.retryMinSpacing,
    }));

    const selectBtn = this.add.text(GAME_WIDTH / 2 + 130, 520, 'Song Select', {
      fontSize: '32px',
      fontFamily: THEME_FONT,
      color: '#ffffff',
      backgroundColor: '#6b7280',
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    selectBtn.on('pointerdown', () => this.fadeToScene(SCENES.SONG_SELECT));
  }

  fadeToScene(scene, data) {
    pageFlipOut(this, () => this.scene.start(scene, data));
  }

  animateCounter(from, to, duration, delay, onUpdate) {
    const counter = { val: from };
    this.tweens.add({
      targets: counter,
      val: to,
      duration,
      delay,
      ease: 'Power2',
      onUpdate: () => onUpdate(Math.round(counter.val))
    });
  }

  gradeColor(grade) {
    const colors = { S: '#fbbf24', A: '#34d399', B: '#60a5fa', C: '#a78bfa', D: '#6b7280' };
    return colors[grade] || '#6b7280';
  }
}

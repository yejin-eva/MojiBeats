import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, THEME_FONT, NOTEBOOK } from '../config.js';
import { pageFlipIn, pageFlipOut } from '../effects/PageFlip.js';
import { calculateGrade, saveScore } from '../storage/ScoreStore.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME_OVER);
  }

  init(data) {
    this.results = data || { score: 0, maxCombo: 0, accuracy: 0, songName: '', songId: null };
  }

  create() {
    this.cameras.main.setBackgroundColor(NOTEBOOK.BG_COLOR);
    pageFlipIn(this);

    this.drawNotebookGrid();

    const { score, maxCombo, accuracy, songId } = this.results;
    const grade = calculateGrade(accuracy);

    if (songId) {
      saveScore(songId, { score, maxCombo, accuracy, grade });
    }

    this.add.text(GAME_WIDTH / 2, 120, '😵 💥 🎮', {
      fontSize: '56px',
      padding: { top: 8, bottom: 4 }
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, 'Game Over', {
      fontSize: '64px',
      fontFamily: THEME_FONT,
      color: '#be123c'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 265, 'The emojis got you this time...', {
      fontSize: '26px',
      fontFamily: THEME_FONT,
      color: '#6b7280'
    }).setOrigin(0.5);

    const scoreText = this.add.text(GAME_WIDTH / 2, 350, 'Score: 0', {
      fontSize: '32px',
      fontFamily: THEME_FONT,
      color: '#374151'
    }).setOrigin(0.5);

    const comboAccText = this.add.text(GAME_WIDTH / 2, 400, 'Max Combo: 0  |  Accuracy: 0%', {
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

    const retryBtn = this.add.text(GAME_WIDTH / 2 - 100, 500, 'Retry', {
      fontSize: '32px',
      fontFamily: THEME_FONT,
      color: '#ffffff',
      backgroundColor: '#ec4899',
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => this.fadeToScene(SCENES.SONG_SELECT));

    const selectBtn = this.add.text(GAME_WIDTH / 2 + 130, 500, 'Song Select', {
      fontSize: '32px',
      fontFamily: THEME_FONT,
      color: '#ffffff',
      backgroundColor: '#6b7280',
      padding: { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    selectBtn.on('pointerdown', () => this.fadeToScene(SCENES.SONG_SELECT));
  }

  fadeToScene(scene) {
    pageFlipOut(this, () => this.scene.start(scene));
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

  drawNotebookGrid() {
    for (let y = NOTEBOOK.GRID_SPACING; y < GAME_HEIGHT; y += NOTEBOOK.GRID_SPACING) {
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 1, NOTEBOOK.GRID_COLOR, NOTEBOOK.GRID_ALPHA);
    }
    for (let x = NOTEBOOK.GRID_SPACING; x < GAME_WIDTH; x += NOTEBOOK.GRID_SPACING) {
      this.add.rectangle(x, GAME_HEIGHT / 2, 1, GAME_HEIGHT, NOTEBOOK.GRID_COLOR, NOTEBOOK.GRID_ALPHA);
    }
    this.add.rectangle(NOTEBOOK.MARGIN_X, GAME_HEIGHT / 2, 2, GAME_HEIGHT, NOTEBOOK.MARGIN_COLOR, NOTEBOOK.MARGIN_ALPHA);
  }
}

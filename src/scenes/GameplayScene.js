import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class GameplayScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAMEPLAY);
  }

  init(data) {
    this.audioManager = data.audioManager || null;
    this.beats = data.beats || [];
    this.bpm = data.bpm || 0;
    this.songName = data.songName || 'Unknown';
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0f');

    this.add.text(GAME_WIDTH / 2, 30, this.songName, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#9ca3af'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 60, `${this.beats.length} beats | ~${Math.round(this.bpm)} BPM`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#6b7280'
    }).setOrigin(0.5);

    this.timeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.beatFlash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7c3aed, 0);
    this.nextBeatIndex = 0;

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'Press ESC to return to Song Select', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#4b5563'
    }).setOrigin(0.5);

    const gameOverBtn = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20, '[Test: Game Over]', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ef4444'
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

    gameOverBtn.on('pointerdown', () => {
      this.stopAudio();
      this.scene.start(SCENES.GAME_OVER);
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.stopAudio();
      this.scene.start(SCENES.SONG_SELECT);
    });

    if (this.audioManager) {
      this.audioManager.play();
    } else {
      this.timeText.setText('No audio loaded');
      this.time.delayedCall(3000, () => {
        if (this.scene.isActive(SCENES.GAMEPLAY)) {
          this.scene.start(SCENES.VICTORY);
        }
      });
    }
  }

  update() {
    if (!this.audioManager || !this.audioManager.playing) {
      if (this.audioManager && this.audioManager.getCurrentTime() > 0) {
        this.scene.start(SCENES.VICTORY);
      }
      return;
    }

    const currentTime = this.audioManager.getCurrentTime();
    const duration = this.audioManager.getDuration();
    this.timeText.setText(`${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`);

    while (
      this.nextBeatIndex < this.beats.length &&
      this.beats[this.nextBeatIndex] <= currentTime
    ) {
      this.flashOnBeat();
      this.nextBeatIndex++;
    }
  }

  flashOnBeat() {
    this.beatFlash.setAlpha(0.15);
    this.tweens.add({
      targets: this.beatFlash,
      alpha: 0,
      duration: 150,
      ease: 'Power2'
    });
  }

  stopAudio() {
    if (this.audioManager) {
      this.audioManager.stop();
    }
  }
}

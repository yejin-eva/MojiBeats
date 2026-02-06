import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, TIMING } from '../config.js';
import { generateBeatmap } from '../gameplay/BeatmapGenerator.js';
import { judge, MISS } from '../gameplay/TimingJudge.js';
import EmojiTarget from '../gameplay/EmojiTarget.js';
import InputHandler from '../gameplay/InputHandler.js';

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

    this.add.text(20, 16, this.songName, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#9ca3af'
    });

    this.judgmentText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'ESC to quit  |  Z/X to hit  |  Move mouse to aim', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#4b5563'
    }).setOrigin(0.5);

    this.beatmap = generateBeatmap(this.beats);
    this.nextSpawnIndex = 0;
    this.activeTargets = [];

    this.inputHandler = new InputHandler(this, (x, y) => this.handleHit(x, y));

    this.input.keyboard.on('keydown-ESC', () => {
      this.stopAudio();
      this.scene.start(SCENES.SONG_SELECT);
    });

    if (this.audioManager) {
      this.audioManager.play();
    } else {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No audio loaded', {
        fontSize: '36px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }
  }

  update() {
    if (!this.audioManager) return;

    const currentTime = this.audioManager.getCurrentTime();

    if (!this.audioManager.playing && currentTime > 0) {
      this.cleanupTargets();
      this.scene.start(SCENES.VICTORY);
      return;
    }

    this.spawnDueTargets(currentTime);
    this.updateTargets(currentTime);
    this.expireMissedTargets(currentTime);
  }

  spawnDueTargets(currentTime) {
    while (
      this.nextSpawnIndex < this.beatmap.length &&
      this.beatmap[this.nextSpawnIndex].spawnTime <= currentTime
    ) {
      const event = this.beatmap[this.nextSpawnIndex];
      const target = new EmojiTarget(this, event);
      this.activeTargets.push(target);
      this.nextSpawnIndex++;
    }
  }

  updateTargets(currentTime) {
    for (const target of this.activeTargets) {
      target.update(currentTime);
    }
  }

  expireMissedTargets(currentTime) {
    for (let i = this.activeTargets.length - 1; i >= 0; i--) {
      const target = this.activeTargets[i];
      if (!target.isAlive) {
        this.activeTargets.splice(i, 1);
        continue;
      }
      const offsetMs = target.getOffsetMs(currentTime);
      if (offsetMs > TIMING.GOOD) {
        target.miss();
        this.showJudgment('Miss', '#ef4444');
        this.activeTargets.splice(i, 1);
      }
    }
  }

  handleHit(x, y) {
    if (!this.audioManager) return;
    const currentTime = this.audioManager.getCurrentTime();

    let closest = null;
    let closestDist = Infinity;

    for (const target of this.activeTargets) {
      if (!target.isAlive) continue;
      if (!target.containsPoint(x, y)) continue;

      const dist = Math.abs(target.getOffsetMs(currentTime));
      if (dist < closestDist) {
        closest = target;
        closestDist = dist;
      }
    }

    if (!closest) return;

    const offsetMs = closest.getOffsetMs(currentTime);
    const result = judge(offsetMs);

    if (result === MISS) return;

    closest.hit();
    const idx = this.activeTargets.indexOf(closest);
    if (idx !== -1) this.activeTargets.splice(idx, 1);

    const colors = {
      perfect: '#fbbf24',
      great: '#34d399',
      good: '#60a5fa'
    };
    this.showJudgment(result.charAt(0).toUpperCase() + result.slice(1), colors[result]);
  }

  showJudgment(text, color) {
    this.judgmentText.setText(text).setColor(color).setAlpha(1);
    this.tweens.add({
      targets: this.judgmentText,
      alpha: 0,
      y: GAME_HEIGHT - 100,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.judgmentText.setY(GAME_HEIGHT - 80);
      }
    });
  }

  cleanupTargets() {
    for (const target of this.activeTargets) {
      target.destroy();
    }
    this.activeTargets = [];
  }

  stopAudio() {
    if (this.audioManager) {
      this.audioManager.stop();
    }
    this.cleanupTargets();
  }
}

import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, TIMING } from '../config.js';
import { generateBeatmap } from '../gameplay/BeatmapGenerator.js';
import { judge, MISS } from '../gameplay/TimingJudge.js';
import { createHealthState, applyDamage, applyComboHeal, isDead } from '../gameplay/HealthSystem.js';
import { createScoreState, applyHit, applyMiss, getAccuracy } from '../gameplay/ScoreSystem.js';
import EmojiTarget from '../gameplay/EmojiTarget.js';
import InputHandler from '../gameplay/InputHandler.js';
import HealthBar from '../ui/HealthBar.js';
import { emitBurst } from '../effects/ParticleBurst.js';
import { emitBleed } from '../effects/HealthBleed.js';
import { showCombo } from '../effects/ComboText.js';
import BackgroundReactive from '../effects/BackgroundReactive.js';

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
    this.cameras.main.setBackgroundColor('#f5f0ff');

    this.healthState = createHealthState();
    this.scoreState = createScoreState();

    this.background = new BackgroundReactive(this);

    this.healthBar = new HealthBar(this);

    this.add.text(20, 16, this.songName, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#6b7280'
    });

    this.scoreText = this.add.text(GAME_WIDTH - 20, 16, '0', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#d97706'
    }).setOrigin(1, 0);

    this.comboText = this.add.text(GAME_WIDTH - 20, 46, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#7c3aed'
    }).setOrigin(1, 0);

    this.judgmentText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#1f2937'
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'ESC to quit  |  Z/X to hit  |  Move mouse to aim', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#9ca3af'
    }).setOrigin(0.5);

    this.beatmap = generateBeatmap(this.beats, this.bpm);
    console.log(`[MojiBeats] Beatmap: ${this.beatmap.length} targets (from ${this.beats.length} raw beats)`);
    this.nextSpawnIndex = 0;
    this.nextBeatIndex = 0;
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
        color: '#6b7280'
      }).setOrigin(0.5);
    }
  }

  update() {
    if (!this.audioManager) return;

    const currentTime = this.audioManager.getCurrentTime();

    if (!this.audioManager.playing && currentTime > 0) {
      this.endSong();
      return;
    }

    this.background.update(this.audioManager);
    this.triggerBeatPulses(currentTime);
    this.spawnDueTargets(currentTime);
    this.updateTargets(currentTime);
    this.expireMissedTargets(currentTime);
  }

  triggerBeatPulses(currentTime) {
    while (
      this.nextBeatIndex < this.beats.length &&
      this.beats[this.nextBeatIndex] <= currentTime
    ) {
      this.background.onBeat();
      this.nextBeatIndex++;
    }
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
        this.onMiss();
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

    const hitX = closest.x;
    const hitY = closest.y;
    const hitColor = closest.color;

    closest.hit();
    const idx = this.activeTargets.indexOf(closest);
    if (idx !== -1) this.activeTargets.splice(idx, 1);

    this.onHit(result, hitX, hitY, hitColor);
  }

  onHit(tier, x, y, color) {
    this.scoreState = applyHit(this.scoreState, tier);
    const prevHp = this.healthState.hp;
    this.healthState = applyComboHeal(this.healthState, this.scoreState.combo);

    emitBurst(this, x, y, color);
    showCombo(this, x, y, this.scoreState.combo, color);

    if (this.healthState.hp > prevHp) {
      this.healthBar.showHeal();
    }

    if (tier === 'perfect') {
      this.cameras.main.shake(50, 0.003);
    }

    this.healthBar.update(this.healthState.hp);
    this.updateHUD();

    const colors = { perfect: '#fbbf24', great: '#34d399', good: '#60a5fa' };
    this.showJudgment(tier.charAt(0).toUpperCase() + tier.slice(1), colors[tier]);
  }

  onMiss() {
    this.scoreState = applyMiss(this.scoreState);
    this.healthState = applyDamage(this.healthState);

    this.healthBar.update(this.healthState.hp);
    this.healthBar.showDamage();
    emitBleed(this);
    this.updateHUD();
    this.showJudgment('Miss', '#ef4444');

    if (isDead(this.healthState)) {
      this.stopAudio();
      this.scene.start(SCENES.GAME_OVER, this.getResults());
    }
  }

  updateHUD() {
    this.scoreText.setText(this.scoreState.score.toLocaleString());
    if (this.scoreState.combo > 1) {
      this.comboText.setText(`${this.scoreState.combo}x combo`);
    } else {
      this.comboText.setText('');
    }
  }

  showJudgment(text, color) {
    this.judgmentText.setText(text).setColor(color).setAlpha(1).setY(GAME_HEIGHT - 80);
    this.tweens.add({
      targets: this.judgmentText,
      alpha: 0,
      y: GAME_HEIGHT - 100,
      duration: 400,
      ease: 'Power2'
    });
  }

  getResults() {
    return {
      score: this.scoreState.score,
      maxCombo: this.scoreState.maxCombo,
      accuracy: getAccuracy(this.scoreState),
      songName: this.songName
    };
  }

  endSong() {
    this.cleanupTargets();
    this.scene.start(SCENES.VICTORY, this.getResults());
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

import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, TIMING, COUNTDOWN_DURATION, THEME_FONT, THEME, NOTEBOOK } from '../config.js';
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
import { pageFlipIn, pageFlipOut } from '../effects/PageFlip.js';
import { emitPerfectConfetti } from '../effects/PerfectFlash.js';
import { playHitSound, playMissSound, playComboSound } from '../audio/SFX.js';

export default class GameplayScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAMEPLAY);
  }

  init(data) {
    this.audioManager = data.audioManager || null;
    this.beats = data.beats || [];
    this.bpm = data.bpm || 0;
    this.songName = data.songName || 'Unknown';
    this.songId = data.songId || null;
    this.minSpacing = data.minSpacing || 0.4;
    this.sensitivity = data.sensitivity || {};
    this.difficultyKey = data.difficultyKey || null;
  }

  create() {
    this.cameras.main.setBackgroundColor(NOTEBOOK.BG_COLOR);
    pageFlipIn(this);

    this.healthState = createHealthState();
    this.scoreState = createScoreState();

    this.background = new BackgroundReactive(this);

    this.healthBar = new HealthBar(this);

    this.add.text(20, 48, this.songName, {
      fontSize: '28px',
      fontFamily: THEME_FONT,
      color: '#5b6abf'
    });

    this.scoreText = this.add.text(GAME_WIDTH - 20, 48, '0', {
      fontSize: '32px',
      fontFamily: THEME_FONT,
      color: '#d97706'
    }).setOrigin(1, 0);

    this.comboText = this.add.text(GAME_WIDTH - 20, 82, '', {
      fontSize: '22px',
      fontFamily: THEME_FONT,
      color: THEME.PRIMARY
    }).setOrigin(1, 0);

    this.judgmentText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '', {
      fontSize: '40px',
      fontFamily: THEME_FONT,
      color: '#1f2937'
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'ESC to pause  |  SPACE/Z/X to hit  |  Move mouse to aim', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#9ca3af'
    }).setOrigin(0.5);

    this.beatmap = generateBeatmap(this.beats, this.bpm, this.minSpacing);
    console.log(`[MojiBeats] Beatmap: ${this.beatmap.length} targets (from ${this.beats.length} raw beats)`);
    this.nextSpawnIndex = 0;
    this.nextBeatIndex = 0;
    this.activeTargets = [];
    this.started = false;

    this.inputHandler = new InputHandler(this, (x, y) => this.handleHit(x, y));

    this.paused = false;
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());

    if (this.audioManager) {
      this.startCountdown();
    } else {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No audio loaded', {
        fontSize: '36px',
        fontFamily: 'Arial',
        color: '#6b7280'
      }).setOrigin(0.5);
    }
  }

  startCountdown() {
    const numbers = [];
    for (let i = COUNTDOWN_DURATION; i >= 1; i--) {
      numbers.push(i);
    }

    numbers.forEach((num, idx) => {
      this.time.delayedCall(idx * 1000, () => {
        const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `${num}`, {
          fontSize: '120px',
          fontFamily: THEME_FONT,
          color: THEME.PRIMARY
        }).setOrigin(0.5).setAlpha(1).setScale(0.5);

        this.tweens.add({
          targets: text,
          scale: 1.5,
          alpha: 0,
          duration: 800,
          ease: 'Power2',
          onComplete: () => text.destroy()
        });
      });
    });

    this.time.delayedCall(COUNTDOWN_DURATION * 1000, () => {
      this.started = true;
      this.audioManager.play();
    });
  }

  update() {
    if (!this.audioManager || !this.started || this.paused) return;

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
      this.nextBeatIndex < this.beatmap.length &&
      this.beatmap[this.nextBeatIndex].beatTime <= currentTime
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
      emitPerfectConfetti(this);
    }
    playHitSound();

    if (this.scoreState.combo > 0 && this.scoreState.combo % 10 === 0) {
      playComboSound();
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
    playMissSound();
    this.updateHUD();
    this.showJudgment('Miss', '#ef4444');

    if (isDead(this.healthState)) {
      this.stopAudio();
      pageFlipOut(this, () => this.scene.start(SCENES.GAME_OVER, this.getResults()));
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
      songName: this.songName,
      songId: this.songId,
      minSpacing: this.minSpacing,
      sensitivity: this.sensitivity,
      difficultyKey: this.difficultyKey,
    };
  }

  endSong() {
    this.cleanupTargets();
    pageFlipOut(this, () => this.scene.start(SCENES.VICTORY, this.getResults()));
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

  togglePause() {
    if (this.paused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  pauseGame() {
    this.paused = true;
    this.time.paused = true;
    this.tweens.pauseAll();
    if (this.audioManager) {
      this.audioManager.pause();
    }
    this.showPauseOverlay();
  }

  resumeGame() {
    this.destroyPauseOverlay();
    this.paused = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    if (this.audioManager && this.started) {
      this.audioManager.play();
    }
  }

  quitToMenu() {
    this.destroyPauseOverlay();
    this.paused = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.stopAudio();
    pageFlipOut(this, () => this.scene.start(SCENES.SONG_SELECT, {}));
  }

  showPauseOverlay() {
    this.pauseOverlay = this.add.container(0, 0).setDepth(1000);

    const dimBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'Paused', {
      fontSize: '64px',
      fontFamily: THEME_FONT,
      color: THEME.PRIMARY,
    }).setOrigin(0.5);

    const resumeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'Resume', {
      fontSize: '36px',
      fontFamily: THEME_FONT,
      color: '#ffffff',
      backgroundColor: THEME.PRIMARY,
      padding: { x: 32, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerover', () => resumeBtn.setStyle({ backgroundColor: THEME.PRIMARY_HOVER }));
    resumeBtn.on('pointerout', () => resumeBtn.setStyle({ backgroundColor: THEME.PRIMARY }));
    resumeBtn.on('pointerdown', () => this.resumeGame());

    const quitBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'Quit to Menu', {
      fontSize: '24px',
      fontFamily: THEME_FONT,
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    quitBtn.on('pointerover', () => quitBtn.setColor('#ef4444'));
    quitBtn.on('pointerout', () => quitBtn.setColor('#ffffff'));
    quitBtn.on('pointerdown', () => this.quitToMenu());

    this.pauseOverlay.add([dimBg, title, resumeBtn, quitBtn]);
  }

  destroyPauseOverlay() {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
  }
}

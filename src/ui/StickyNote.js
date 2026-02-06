import { STICKY_NOTE, GAME_WIDTH, THEME_FONT } from '../config.js';

const STATE_COLLAPSED = 0;
const STATE_PEEKED = 1;
const STATE_SELECTED = 2;

export default class StickyNote {
  constructor(scene, songData, colorTheme, index) {
    this.scene = scene;
    this.songData = songData;
    this.color = colorTheme;
    this.index = index;
    this.state = STATE_COLLAPSED;

    this.container = scene.add.container(0, 0);
    this.buildVisuals();
    this.positionCollapsed();
    this.addInteraction();
  }

  buildVisuals() {
    const { WIDTH, HEIGHT } = STICKY_NOTE;
    const { bg, border, text: textColor } = this.color;

    this.bgRect = this.scene.add.rectangle(0, 0, WIDTH, HEIGHT, Phaser.Display.Color.HexStringToColor(bg).color)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(border).color);

    const tapeWidth = 40;
    const tapeHeight = 12;
    this.tape = this.scene.add.rectangle(0, -HEIGHT / 2 + 2, tapeWidth, tapeHeight, 0xffffff, 0.6)
      .setStrokeStyle(1, 0xcccccc);

    this.emojiText = this.scene.add.text(0, -20, this.songData.emoji || '🎵', {
      fontSize: '32px',
      padding: { top: 4, bottom: 4 },
    }).setOrigin(0.5);

    const maxTitleLen = 14;
    const title = this.songData.title || 'Untitled';
    const displayTitle = title.length > maxTitleLen ? title.slice(0, maxTitleLen - 1) + '…' : title;

    this.titleText = this.scene.add.text(0, 16, displayTitle, {
      fontSize: '14px',
      fontFamily: THEME_FONT,
      color: textColor,
      align: 'center',
      wordWrap: { width: STICKY_NOTE.WIDTH - 16 },
    }).setOrigin(0.5);

    this.detailText = this.scene.add.text(0, 38, this.getDetailString(), {
      fontSize: '11px',
      fontFamily: THEME_FONT,
      color: textColor,
      align: 'center',
      alpha: 0,
    }).setOrigin(0.5);

    this.playBtn = this.scene.add.text(0, 50, '▶ Play', {
      fontSize: '16px',
      fontFamily: THEME_FONT,
      color: '#ffffff',
      backgroundColor: '#7c3aed',
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.playBtn.on('pointerover', () => this.playBtn.setStyle({ backgroundColor: '#6d28d9' }));
    this.playBtn.on('pointerout', () => this.playBtn.setStyle({ backgroundColor: '#7c3aed' }));
    this.playBtn.on('pointerdown', () => {
      this.scene.events.emit('sticky-play', this.songData.id);
    });

    this.container.add([this.bgRect, this.tape, this.emojiText, this.titleText, this.detailText, this.playBtn]);
  }

  getDetailString() {
    const parts = [];
    if (this.songData.bpm) parts.push(`${Math.round(this.songData.bpm)} BPM`);
    if (this.songData.bestScore !== undefined && this.songData.bestScore !== null) {
      parts.push(`Best: ${this.songData.bestScore.toLocaleString()}`);
    }
    if (this.songData.grade) parts.push(this.songData.grade);
    return parts.join('  ·  ') || '';
  }

  positionCollapsed() {
    const { FAN_OVERLAP, WIDTH, COLLAPSED_Y, TILT_RANGE, MAX_VISIBLE } = STICKY_NOTE;
    const totalWidth = MAX_VISIBLE * (WIDTH - FAN_OVERLAP) + FAN_OVERLAP;
    const startX = (GAME_WIDTH - totalWidth) / 2 + WIDTH / 2;
    const x = startX + this.index * (WIDTH - FAN_OVERLAP);

    this.container.setPosition(x, COLLAPSED_Y);
    this.tilt = (Math.random() - 0.5) * TILT_RANGE * 2;
    this.container.setAngle(this.tilt);
    this.container.setScale(1);
  }

  addInteraction() {
    this.bgRect.setInteractive({ useHandCursor: true });

    this.bgRect.on('pointerover', () => {
      if (this.state === STATE_COLLAPSED) this.peek();
    });

    this.bgRect.on('pointerout', () => {
      if (this.state === STATE_PEEKED) this.collapse();
    });

    this.bgRect.on('pointerdown', () => {
      if (this.state !== STATE_SELECTED) {
        this.scene.events.emit('sticky-select', this.songData.id);
      }
    });
  }

  peek() {
    if (this.state === STATE_SELECTED) return;
    this.state = STATE_PEEKED;

    this.scene.tweens.add({
      targets: this.container,
      y: STICKY_NOTE.PEEK_Y,
      duration: STICKY_NOTE.PEEK_DURATION,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: this.detailText,
      alpha: 0.8,
      duration: STICKY_NOTE.PEEK_DURATION,
    });
  }

  collapse() {
    if (this.state === STATE_SELECTED) return;
    this.state = STATE_COLLAPSED;

    this.scene.tweens.add({
      targets: this.container,
      y: STICKY_NOTE.COLLAPSED_Y,
      duration: STICKY_NOTE.PEEK_DURATION,
      ease: 'Power2',
    });

    this.scene.tweens.add({
      targets: this.detailText,
      alpha: 0,
      duration: STICKY_NOTE.PEEK_DURATION,
    });
  }

  select() {
    this.state = STATE_SELECTED;
    this.container.setDepth(100);

    this.scene.tweens.add({
      targets: this.container,
      x: GAME_WIDTH / 2,
      y: STICKY_NOTE.SELECTED_Y,
      scaleX: STICKY_NOTE.SELECTED_SCALE,
      scaleY: STICKY_NOTE.SELECTED_SCALE,
      angle: 0,
      duration: STICKY_NOTE.LIFT_DURATION,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: this.detailText,
      alpha: 1,
      duration: STICKY_NOTE.LIFT_DURATION,
    });

    this.scene.tweens.add({
      targets: this.playBtn,
      alpha: 1,
      duration: 200,
      delay: STICKY_NOTE.LIFT_DURATION - 100,
    });
  }

  deselect() {
    this.state = STATE_COLLAPSED;
    this.container.setDepth(this.index);

    this.positionTarget();

    this.scene.tweens.add({
      targets: this.playBtn,
      alpha: 0,
      duration: 100,
    });
  }

  positionTarget() {
    const { FAN_OVERLAP, WIDTH, COLLAPSED_Y, MAX_VISIBLE } = STICKY_NOTE;
    const totalWidth = MAX_VISIBLE * (WIDTH - FAN_OVERLAP) + FAN_OVERLAP;
    const startX = (GAME_WIDTH - totalWidth) / 2 + WIDTH / 2;
    const x = startX + this.index * (WIDTH - FAN_OVERLAP);

    this.scene.tweens.add({
      targets: this.container,
      x,
      y: COLLAPSED_Y,
      scaleX: 1,
      scaleY: 1,
      angle: this.tilt,
      duration: STICKY_NOTE.LIFT_DURATION,
      ease: 'Power2',
    });

    this.scene.tweens.add({
      targets: this.detailText,
      alpha: 0,
      duration: STICKY_NOTE.PEEK_DURATION,
    });
  }

  destroy() {
    this.container.destroy();
  }
}

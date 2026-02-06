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

    this.bgRect = this.scene.add.rectangle(0, 0, WIDTH, HEIGHT, Phaser.Display.Color.HexStringToColor(bg).color);

    const tapeWidth = WIDTH * 0.24;
    const tapeHeight = HEIGHT * 0.09;
    this.tape = this.scene.add.rectangle(0, -HEIGHT / 2 + 2, tapeWidth, tapeHeight, 0xffffff, 0.6)
      .setStrokeStyle(1, 0xcccccc);

    this.emojiText = this.scene.add.text(0, -HEIGHT * 0.31, this.songData.emoji || '🎵', {
      fontSize: `${Math.round(HEIGHT * 0.14)}px`,
      padding: { top: 2, bottom: 2 },
    }).setOrigin(0.5);

    const maxTitleLen = 14;
    const title = this.songData.title || 'Untitled';
    const displayTitle = title.length > maxTitleLen ? title.slice(0, maxTitleLen - 1) + '…' : title;

    this.titleText = this.scene.add.text(0, -HEIGHT * 0.17, displayTitle, {
      fontSize: `${Math.round(HEIGHT * 0.11)}px`,
      fontFamily: THEME_FONT,
      color: textColor,
      align: 'center',
      wordWrap: { width: WIDTH - 16 },
    }).setOrigin(0.5);

    this.detailText = this.scene.add.text(0, HEIGHT * 0.1, this.getDetailString(), {
      fontSize: `${Math.round(HEIGHT * 0.085)}px`,
      fontFamily: THEME_FONT,
      color: textColor,
      align: 'center',
      wordWrap: { width: WIDTH - 20 },
      lineSpacing: 2,
      alpha: 0,
    }).setOrigin(0.5);

    this.container.add([this.bgRect, this.tape, this.emojiText, this.titleText, this.detailText]);

    this.playBtn = this.scene.add.text(0, 0, '▶ Play', {
      fontSize: '16px',
      fontFamily: THEME_FONT,
      color: '#ffffff',
      backgroundColor: '#7c3aed',
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true }).setDepth(101);

    this.playBtn.on('pointerover', () => this.playBtn.setStyle({ backgroundColor: '#6d28d9' }));
    this.playBtn.on('pointerout', () => this.playBtn.setStyle({ backgroundColor: '#7c3aed' }));
    this.playBtn.on('pointerdown', () => {
      this.scene.events.emit('sticky-play', this.songData.id);
    });

    this.deleteBtn = this.scene.add.text(0, 0, '🗑️', {
      fontSize: '18px',
      padding: { top: 2, bottom: 2 },
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true }).setDepth(101);

    this.deleteBtn.on('pointerdown', () => {
      this.scene.events.emit('sticky-delete', this.songData.id);
    });
  }

  getDetailString() {
    const parts = [];
    if (this.songData.bpm) parts.push(`${Math.round(this.songData.bpm)} BPM`);
    if (this.songData.bestScore !== undefined && this.songData.bestScore !== null) {
      parts.push(`Best: ${this.songData.bestScore.toLocaleString()}`);
    }
    if (this.songData.grade) parts.push(this.songData.grade);
    return parts.join('\n') || '';
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
    const { WIDTH, HEIGHT } = STICKY_NOTE;
    const hitArea = new Phaser.Geom.Rectangle(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
    this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    this.container.input.cursor = 'pointer';

    this.container.on('pointerover', () => {
      if (this.state === STATE_COLLAPSED) this.peek();
    });

    this.container.on('pointerout', () => {
      if (this.state === STATE_PEEKED) this.collapse();
    });

    this.container.on('pointerdown', () => {
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
      ease: 'Power2',
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

    const { SELECTED_Y, SELECTED_SCALE, HEIGHT, WIDTH, LIFT_DURATION } = STICKY_NOTE;
    const scaledHalfH = (HEIGHT / 2) * SELECTED_SCALE;
    const scaledHalfW = (WIDTH / 2) * SELECTED_SCALE;

    this.scene.tweens.add({
      targets: this.container,
      x: GAME_WIDTH / 2,
      y: SELECTED_Y,
      scaleX: SELECTED_SCALE,
      scaleY: SELECTED_SCALE,
      angle: 0,
      duration: LIFT_DURATION,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: this.detailText,
      alpha: 1,
      duration: LIFT_DURATION,
    });

    this.scene.tweens.add({
      targets: this.playBtn,
      x: GAME_WIDTH / 2,
      y: SELECTED_Y + scaledHalfH + 28,
      alpha: 1,
      duration: LIFT_DURATION,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: this.deleteBtn,
      x: GAME_WIDTH / 2 + scaledHalfW + 20,
      y: SELECTED_Y - scaledHalfH + 10,
      alpha: 1,
      duration: 200,
      delay: LIFT_DURATION - 100,
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
    this.scene.tweens.add({
      targets: this.deleteBtn,
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
    this.playBtn.destroy();
    this.deleteBtn.destroy();
  }
}

import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class SongSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SONG_SELECT);
  }

  create() {
    this.cameras.main.setBackgroundColor('#f5f0ff');

    this.add.text(GAME_WIDTH / 2, 160, 'MojiBeats', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#7c3aed'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 240, 'Select a Song', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#6b7280'
    }).setOrigin(0.5);

    const playBtn = this.add.text(GAME_WIDTH / 2, 400, '▶  Play', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#7c3aed',
      padding: { x: 40, y: 16 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#6d28d9' }));
    playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#7c3aed' }));
    playBtn.on('pointerdown', () => this.scene.start(SCENES.GAMEPLAY));
  }
}

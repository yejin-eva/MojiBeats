import Phaser from 'phaser';
import { SCENES, THEME_FONT } from '../config.js';
import { cacheEmojiTextures } from '../gameplay/EmojiCache.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  async create() {
    cacheEmojiTextures(this);
    await document.fonts.load(`16px "${THEME_FONT}"`);
    this.scene.start(SCENES.SONG_SELECT);
  }
}

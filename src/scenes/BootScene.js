import Phaser from 'phaser';
import { SCENES } from '../config.js';
import { cacheEmojiTextures } from '../gameplay/EmojiCache.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  create() {
    cacheEmojiTextures(this);
    this.scene.start(SCENES.SONG_SELECT);
  }
}

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import BootScene from './scenes/BootScene.js';
import SongSelectScene from './scenes/SongSelectScene.js';
import GameplayScene from './scenes/GameplayScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const dpr = window.devicePixelRatio || 1;

if (dpr > 1) {
  const _addText = Phaser.GameObjects.GameObjectFactory.prototype.text;
  Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
    style = style ? { ...style, resolution: style.resolution || dpr } : { resolution: dpr };
    return _addText.call(this, x, y, text, style);
  };
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#f8f8f8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, SongSelectScene, GameplayScene, GameOverScene, VictoryScene]
};

new Phaser.Game(config);

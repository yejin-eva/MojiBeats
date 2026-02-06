import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import BootScene from './scenes/BootScene.js';
import SongSelectScene from './scenes/SongSelectScene.js';
import GameplayScene from './scenes/GameplayScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#f5f0ff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, SongSelectScene, GameplayScene, GameOverScene, VictoryScene]
};

new Phaser.Game(config);

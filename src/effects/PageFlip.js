import { GAME_WIDTH, GAME_HEIGHT, NOTEBOOK } from '../config.js';

const FLIP_DURATION = 350;
const SHADOW_WIDTH = 6;
const SHADOW_COLOR = 0x000000;
const SHADOW_ALPHA = 0.12;
const PAGE_COLOR = parseInt(NOTEBOOK.BG_COLOR.replace('#', ''), 16);

export function pageFlipOut(scene, callback) {
  const page = scene.add.rectangle(
    GAME_WIDTH + GAME_WIDTH / 2, GAME_HEIGHT / 2,
    GAME_WIDTH + 20, GAME_HEIGHT + 20, PAGE_COLOR
  ).setDepth(9999);

  const shadow = scene.add.rectangle(
    GAME_WIDTH, GAME_HEIGHT / 2,
    SHADOW_WIDTH, GAME_HEIGHT, SHADOW_COLOR, SHADOW_ALPHA
  ).setDepth(9998);

  scene.tweens.add({
    targets: [page, shadow],
    x: `-=${GAME_WIDTH}`,
    duration: FLIP_DURATION,
    ease: 'Power2.easeInOut',
    onComplete: () => callback()
  });
}

export function pageFlipIn(scene) {
  const page = scene.add.rectangle(
    GAME_WIDTH / 2, GAME_HEIGHT / 2,
    GAME_WIDTH + 20, GAME_HEIGHT + 20, PAGE_COLOR
  ).setDepth(9999);

  const shadow = scene.add.rectangle(
    0, GAME_HEIGHT / 2,
    SHADOW_WIDTH, GAME_HEIGHT, SHADOW_COLOR, SHADOW_ALPHA
  ).setDepth(9998);

  scene.tweens.add({
    targets: [page, shadow],
    x: `-=${GAME_WIDTH}`,
    duration: FLIP_DURATION,
    ease: 'Power2.easeInOut',
    onComplete: () => {
      page.destroy();
      shadow.destroy();
    }
  });
}

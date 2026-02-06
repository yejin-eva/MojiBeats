import { GAME_WIDTH, GAME_HEIGHT, NOTEBOOK, EMOJI_TEXTURE } from '../config.js';

const DOODLE_EMOJIS = ['🎵','🎶','🎸','🎤','🎹','⭐','🎧','🎺','🎻','🥁'];
const DOODLE_COUNT = 14;
const DOODLE_CANVAS_SIZE = 100;
const DOODLE_FONT_SIZE = 48;

function ensureDoodleTextures(scene) {
  DOODLE_EMOJIS.forEach((emoji, i) => {
    const key = `doodle_${i}`;
    if (scene.textures.exists(key)) return;

    const canvas = document.createElement('canvas');
    canvas.width = DOODLE_CANVAS_SIZE;
    canvas.height = DOODLE_CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.font = `${DOODLE_FONT_SIZE}px ${EMOJI_TEXTURE.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, DOODLE_CANVAS_SIZE / 2, DOODLE_CANVAS_SIZE / 2);

    // Trim to actual emoji pixels to avoid invisible padding clipping
    const imageData = ctx.getImageData(0, 0, DOODLE_CANVAS_SIZE, DOODLE_CANVAS_SIZE);
    const { data } = imageData;
    let top = DOODLE_CANVAS_SIZE, bottom = 0, left = DOODLE_CANVAS_SIZE, right = 0;
    for (let py = 0; py < DOODLE_CANVAS_SIZE; py++) {
      for (let px = 0; px < DOODLE_CANVAS_SIZE; px++) {
        if (data[(py * DOODLE_CANVAS_SIZE + px) * 4 + 3] > 0) {
          if (py < top) top = py;
          if (py > bottom) bottom = py;
          if (px < left) left = px;
          if (px > right) right = px;
        }
      }
    }

    const pad = 2;
    top = Math.max(0, top - pad);
    left = Math.max(0, left - pad);
    bottom = Math.min(DOODLE_CANVAS_SIZE - 1, bottom + pad);
    right = Math.min(DOODLE_CANVAS_SIZE - 1, right + pad);
    const tw = right - left + 1;
    const th = bottom - top + 1;

    const trimmed = document.createElement('canvas');
    trimmed.width = tw;
    trimmed.height = th;
    trimmed.getContext('2d').drawImage(canvas, left, top, tw, th, 0, 0, tw, th);
    scene.textures.addCanvas(key, trimmed);
  });
}

export function drawNotebookGrid(scene) {
  const lines = [];

  for (let y = NOTEBOOK.GRID_SPACING; y < GAME_HEIGHT; y += NOTEBOOK.GRID_SPACING) {
    lines.push(scene.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 1, NOTEBOOK.GRID_COLOR, NOTEBOOK.GRID_ALPHA));
  }

  for (let x = NOTEBOOK.GRID_SPACING; x < GAME_WIDTH; x += NOTEBOOK.GRID_SPACING) {
    lines.push(scene.add.rectangle(x, GAME_HEIGHT / 2, 1, GAME_HEIGHT, NOTEBOOK.GRID_COLOR, NOTEBOOK.GRID_ALPHA));
  }

  const margin = scene.add.rectangle(NOTEBOOK.MARGIN_X, GAME_HEIGHT / 2, 2, GAME_HEIGHT, NOTEBOOK.MARGIN_COLOR, NOTEBOOK.MARGIN_ALPHA);

  return { lines, margin };
}

export function scatterDoodles(scene) {
  ensureDoodleTextures(scene);
  const doodles = [];

  for (let i = 0; i < DOODLE_COUNT; i++) {
    const texIdx = i % DOODLE_EMOJIS.length;
    const pad = 40;
    const x = pad + Math.random() * (GAME_WIDTH - pad * 2);
    const y = pad + Math.random() * (GAME_HEIGHT - pad * 2);
    const scale = 0.4 + Math.random() * 0.4;
    const angle = (Math.random() - 0.5) * 30;

    const doodle = scene.add.image(x, y, `doodle_${texIdx}`)
      .setScale(scale).setAlpha(0.2).setAngle(angle).setDepth(-1);

    doodles.push(doodle);
  }

  return doodles;
}

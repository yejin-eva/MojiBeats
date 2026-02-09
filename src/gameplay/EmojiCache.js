import { EMOJI_POOL, EMOJI_TEXTURE } from '../config.js';

export const FRAGMENT_COLS = 6;
export const FRAGMENT_ROWS = 6;

export function getEmojiTextureKey(emoji) {
  const index = EMOJI_POOL.indexOf(emoji);
  return `emoji_filled_${index}`;
}

export function getOutlineTextureKey(emoji) {
  const index = EMOJI_POOL.indexOf(emoji);
  return `emoji_outline_${index}`;
}

export function getFragmentKeys(emoji) {
  const index = EMOJI_POOL.indexOf(emoji);
  const keys = [];
  for (let r = 0; r < FRAGMENT_ROWS; r++) {
    for (let c = 0; c < FRAGMENT_COLS; c++) {
      const key = `emoji_frag_${index}_${r}_${c}`;
      keys.push({ key, col: c, row: r });
    }
  }
  return keys;
}

export function generateOutlineData(imageData, canvasSize, dilationRadius) {
  const { data, width, height } = imageData;
  const alpha = new Uint8Array(width * height);

  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = data[i * 4 + 3];
  }

  const dilated = new Uint8Array(width * height);
  const r = dilationRadius;
  const rSq = r * r;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > rSq) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const val = alpha[ny * width + nx];
          if (val > maxVal) maxVal = val;
        }
      }
      dilated[y * width + x] = maxVal;
    }
  }

  const outData = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const outAlpha = Math.max(dilated[i] - alpha[i], 0);
    outData[i * 4] = 255;
    outData[i * 4 + 1] = 255;
    outData[i * 4 + 2] = 255;
    outData[i * 4 + 3] = outAlpha;
  }

  return { data: outData, width, height };
}

export function cacheEmojiTextures(scene) {
  const { CANVAS_SIZE, FONT_SIZE, DILATION_RADIUS, FONT_FAMILY } = EMOJI_TEXTURE;

  EMOJI_POOL.forEach((emoji, index) => {
    const filledKey = `emoji_filled_${index}`;
    const outlineKey = `emoji_outline_${index}`;

    if (scene.textures.exists(filledKey)) return;

    const filledCanvas = document.createElement('canvas');
    filledCanvas.width = CANVAS_SIZE;
    filledCanvas.height = CANVAS_SIZE;
    const filledCtx = filledCanvas.getContext('2d');
    filledCtx.textAlign = 'center';
    filledCtx.textBaseline = 'middle';
    filledCtx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    filledCtx.fillText(emoji, CANVAS_SIZE / 2, CANVAS_SIZE / 2);

    scene.textures.addCanvas(filledKey, filledCanvas);

    const pixelData = filledCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const outlineResult = generateOutlineData(pixelData, CANVAS_SIZE, DILATION_RADIUS);

    const outlineCanvas = document.createElement('canvas');
    outlineCanvas.width = CANVAS_SIZE;
    outlineCanvas.height = CANVAS_SIZE;
    const outlineCtx = outlineCanvas.getContext('2d');
    const outlineImageData = outlineCtx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
    outlineImageData.data.set(outlineResult.data);
    outlineCtx.putImageData(outlineImageData, 0, 0);

    scene.textures.addCanvas(outlineKey, outlineCanvas);

    // Generate fragment textures for shatter effect
    const fragW = CANVAS_SIZE / FRAGMENT_COLS;
    const fragH = CANVAS_SIZE / FRAGMENT_ROWS;
    for (let r = 0; r < FRAGMENT_ROWS; r++) {
      for (let c = 0; c < FRAGMENT_COLS; c++) {
        const fragKey = `emoji_frag_${index}_${r}_${c}`;
        const sx = c * fragW;
        const sy = r * fragH;

        const fragData = filledCtx.getImageData(sx, sy, fragW, fragH);
        let hasPixels = false;
        for (let i = 3; i < fragData.data.length; i += 4) {
          if (fragData.data[i] > 30) { hasPixels = true; break; }
        }

        const fragCanvas = document.createElement('canvas');
        fragCanvas.width = fragW;
        fragCanvas.height = fragH;
        if (hasPixels) {
          fragCanvas.getContext('2d').drawImage(filledCanvas, sx, sy, fragW, fragH, 0, 0, fragW, fragH);
        }
        scene.textures.addCanvas(fragKey, fragCanvas);
      }
    }
  });
}

import { EMOJI_POOL, EMOJI_TEXTURE } from '../config.js';

export function getEmojiTextureKey(emoji) {
  const index = EMOJI_POOL.indexOf(emoji);
  return `emoji_filled_${index}`;
}

export function getOutlineTextureKey(emoji) {
  const index = EMOJI_POOL.indexOf(emoji);
  return `emoji_outline_${index}`;
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
  });
}

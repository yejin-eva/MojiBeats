import { describe, it, expect } from 'vitest';
import { generateOutlineData, getEmojiTextureKey, getOutlineTextureKey } from '../../src/gameplay/EmojiCache.js';

describe('getEmojiTextureKey', () => {
  it('returns correct key format', () => {
    expect(getEmojiTextureKey('👾')).toBe('emoji_filled_0');
    expect(getEmojiTextureKey('👻')).toBe('emoji_filled_1');
    expect(getEmojiTextureKey('🦇')).toBe('emoji_filled_14');
  });

  it('returns undefined index for unknown emoji', () => {
    expect(getEmojiTextureKey('🍕')).toBe('emoji_filled_-1');
  });
});

describe('getOutlineTextureKey', () => {
  it('returns correct key format', () => {
    expect(getOutlineTextureKey('👾')).toBe('emoji_outline_0');
    expect(getOutlineTextureKey('👻')).toBe('emoji_outline_1');
    expect(getOutlineTextureKey('🦇')).toBe('emoji_outline_14');
  });
});

describe('generateOutlineData', () => {
  function makeImageData(width, height, alphaFn) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const alpha = alphaFn(x, y);
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = alpha;
      }
    }
    return { data, width, height };
  }

  it('returns empty output for fully transparent input', () => {
    const input = makeImageData(10, 10, () => 0);
    const result = generateOutlineData(input, 10, 2);
    const hasAnyAlpha = result.data.some((v, i) => i % 4 === 3 && v > 0);
    expect(hasAnyAlpha).toBe(false);
  });

  it('returns empty output for fully opaque input', () => {
    const input = makeImageData(10, 10, () => 255);
    const result = generateOutlineData(input, 10, 2);
    const hasAnyAlpha = result.data.some((v, i) => i % 4 === 3 && v > 0);
    expect(hasAnyAlpha).toBe(false);
  });

  it('generates outline at edges of a solid square', () => {
    const input = makeImageData(20, 20, (x, y) => {
      return (x >= 5 && x < 15 && y >= 5 && y < 15) ? 255 : 0;
    });
    const result = generateOutlineData(input, 20, 2);

    // Center of the square should have no outline (interior)
    const centerIdx = (10 * 20 + 10) * 4 + 3;
    expect(result.data[centerIdx]).toBe(0);

    // Edge of the square (just outside) should have outline
    const edgeIdx = (5 * 20 + 3) * 4 + 3;
    expect(result.data[edgeIdx]).toBeGreaterThan(0);
  });

  it('outline width corresponds to dilation radius', () => {
    const input = makeImageData(30, 30, (x, y) => {
      return (x >= 10 && x < 20 && y >= 10 && y < 20) ? 255 : 0;
    });

    const result1 = generateOutlineData(input, 30, 1);
    const result3 = generateOutlineData(input, 30, 3);

    // Count non-zero alpha pixels for each
    let count1 = 0;
    let count3 = 0;
    for (let i = 3; i < result1.data.length; i += 4) {
      if (result1.data[i] > 0) count1++;
      if (result3.data[i] > 0) count3++;
    }
    expect(count3).toBeGreaterThan(count1);
  });

  it('output dimensions match input dimensions', () => {
    const input = makeImageData(16, 16, () => 128);
    const result = generateOutlineData(input, 16, 2);
    expect(result.width).toBe(16);
    expect(result.height).toBe(16);
    expect(result.data.length).toBe(16 * 16 * 4);
  });
});

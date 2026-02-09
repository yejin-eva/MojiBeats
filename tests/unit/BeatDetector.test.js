import { describe, it, expect } from 'vitest';
import { detectBeats, estimateBpm, analyzeBeats } from '../../src/audio/BeatDetector.js';

function makeSilence(sampleRate, durationSec) {
  return new Float32Array(sampleRate * durationSec);
}

function addClick(buffer, sampleRate, timeSec, amplitude = 1.0) {
  const idx = Math.floor(timeSec * sampleRate);
  const clickLen = Math.floor(sampleRate * 0.005);
  for (let i = 0; i < clickLen && idx + i < buffer.length; i++) {
    buffer[idx + i] = amplitude * (1 - i / clickLen);
  }
}

function makeClickTrack(sampleRate, durationSec, intervalSec) {
  const buffer = makeSilence(sampleRate, durationSec);
  const times = [];
  for (let t = intervalSec; t < durationSec - 0.1; t += intervalSec) {
    addClick(buffer, sampleRate, t);
    times.push(t);
  }
  return { buffer, times };
}

describe('detectBeats', () => {
  it('returns an array', () => {
    const buffer = makeSilence(44100, 1);
    const beats = detectBeats(buffer, 44100);
    expect(Array.isArray(beats)).toBe(true);
  });

  it('returns no beats for silence', () => {
    const buffer = makeSilence(44100, 2);
    const beats = detectBeats(buffer, 44100);
    expect(beats.length).toBe(0);
  });

  it('detects beats from a 120 BPM click track', () => {
    const bpm = 120;
    const interval = 60 / bpm; // 0.5s
    const { buffer, times } = makeClickTrack(44100, 5, interval);
    const beats = detectBeats(buffer, 44100);

    expect(beats.length).toBeGreaterThan(0);

    // Each detected beat should be within 50ms of an expected beat
    for (const beat of beats) {
      const closest = times.reduce((best, t) =>
        Math.abs(t - beat) < Math.abs(best - beat) ? t : best
      );
      expect(Math.abs(beat - closest)).toBeLessThan(0.05);
    }
  });

  it('detects most beats from a click track (recall > 60%)', () => {
    const interval = 0.5;
    const { buffer, times } = makeClickTrack(44100, 5, interval);
    const beats = detectBeats(buffer, 44100);

    let matched = 0;
    for (const expected of times) {
      if (beats.some(b => Math.abs(b - expected) < 0.05)) {
        matched++;
      }
    }
    expect(matched / times.length).toBeGreaterThan(0.6);
  });

  it('returns beats sorted in ascending order', () => {
    const { buffer } = makeClickTrack(44100, 4, 0.5);
    const beats = detectBeats(buffer, 44100);
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i]).toBeGreaterThan(beats[i - 1]);
    }
  });
});

describe('estimateBpm', () => {
  it('estimates ~120 BPM from 0.5s intervals', () => {
    const beats = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
    const bpm = estimateBpm(beats);
    expect(bpm).toBeGreaterThan(110);
    expect(bpm).toBeLessThan(130);
  });

  it('estimates ~90 BPM from 0.667s intervals', () => {
    const interval = 60 / 90;
    const beats = [];
    for (let t = interval; t < 5; t += interval) {
      beats.push(t);
    }
    const bpm = estimateBpm(beats);
    expect(bpm).toBeGreaterThan(80);
    expect(bpm).toBeLessThan(100);
  });

  it('returns 0 for empty beats', () => {
    expect(estimateBpm([])).toBe(0);
  });

  it('returns 0 for a single beat', () => {
    expect(estimateBpm([1.0])).toBe(0);
  });
});

describe('analyzeBeats', () => {
  it('returns beats and bpm for a click track', () => {
    const { buffer } = makeClickTrack(44100, 8, 0.5);
    const result = analyzeBeats(buffer, 44100);
    expect(result).toHaveProperty('beats');
    expect(result).toHaveProperty('bpm');
    expect(Array.isArray(result.beats)).toBe(true);
    expect(result.beats.length).toBeGreaterThan(0);
  });

  it('returns empty beats and 0 bpm for silence', () => {
    const buffer = makeSilence(44100, 2);
    const result = analyzeBeats(buffer, 44100);
    expect(result.beats.length).toBe(0);
    expect(result.bpm).toBe(0);
  });

  it('detects ~120 BPM from a 120 BPM click track', () => {
    const { buffer } = makeClickTrack(44100, 10, 0.5);
    const result = analyzeBeats(buffer, 44100);
    expect(result.bpm).toBeGreaterThan(110);
    expect(result.bpm).toBeLessThan(130);
  });

  it('detects ~90 BPM from a 90 BPM click track', () => {
    const interval = 60 / 90;
    const { buffer } = makeClickTrack(44100, 10, interval);
    const result = analyzeBeats(buffer, 44100);
    expect(result.bpm).toBeGreaterThan(80);
    expect(result.bpm).toBeLessThan(100);
  });

  it('returns sorted beats', () => {
    const { buffer } = makeClickTrack(44100, 8, 0.5);
    const result = analyzeBeats(buffer, 44100);
    for (let i = 1; i < result.beats.length; i++) {
      expect(result.beats[i]).toBeGreaterThan(result.beats[i - 1]);
    }
  });
});

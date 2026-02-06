import { describe, it, expect } from 'vitest';
import { sanitizeTitle, createSongRecord } from '../../src/storage/SongLibrary.js';

describe('sanitizeTitle', () => {
  it('strips .mp3 extension', () => {
    expect(sanitizeTitle('song.mp3')).toBe('song');
  });

  it('strips any extension', () => {
    expect(sanitizeTitle('my-track.wav')).toBe('my-track');
  });

  it('handles names with multiple dots', () => {
    expect(sanitizeTitle('my.cool.song.mp3')).toBe('my.cool.song');
  });

  it('returns name unchanged if no extension', () => {
    expect(sanitizeTitle('songname')).toBe('songname');
  });
});

describe('createSongRecord', () => {
  it('returns correct shape with defaults', () => {
    const record = createSongRecord({});
    expect(record.title).toBe('Untitled');
    expect(record.bpm).toBe(0);
    expect(record.audioBlob).toBeNull();
    expect(record.emoji).toBe('🎵');
    expect(record.beatCount).toBe(0);
    expect(record.playCount).toBe(0);
    expect(typeof record.dateAdded).toBe('number');
  });

  it('uses provided values', () => {
    const blob = new Uint8Array([1, 2, 3]);
    const record = createSongRecord({
      title: 'My Song',
      bpm: 120,
      audioBlob: blob,
      emoji: '🔥',
      beatCount: 42,
    });
    expect(record.title).toBe('My Song');
    expect(record.bpm).toBe(120);
    expect(record.audioBlob).toBe(blob);
    expect(record.emoji).toBe('🔥');
    expect(record.beatCount).toBe(42);
  });
});

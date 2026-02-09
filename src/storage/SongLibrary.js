import { STORAGE } from '../config.js';

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE.DB_NAME, STORAGE.DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORAGE.SONGS_STORE)) {
        db.createObjectStore(STORAGE.SONGS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

export function sanitizeTitle(filename) {
  return filename.replace(/\.[^.]+$/, '');
}

export function createSongRecord({ title, bpm, audioBlob, emoji, beatCount, type, youtubeVideoId, duration }) {
  return {
    title: title || 'Untitled',
    bpm: bpm || 0,
    audioBlob: audioBlob || null,
    emoji: emoji || '🎵',
    beatCount: beatCount || 0,
    type: type || 'mp3',
    youtubeVideoId: youtubeVideoId || null,
    duration: duration || 0,
    dateAdded: Date.now(),
    playCount: 0,
  };
}

export async function saveSong(songData) {
  const db = await openDB();
  const record = createSongRecord(songData);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE.SONGS_STORE, 'readwrite');
    const store = tx.objectStore(STORAGE.SONGS_STORE);
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSongs() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE.SONGS_STORE, 'readonly');
    const store = tx.objectStore(STORAGE.SONGS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const songs = request.result.map(({ audioBlob, ...meta }) => meta);
      resolve(songs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getSongBlob(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE.SONGS_STORE, 'readonly');
    const store = tx.objectStore(STORAGE.SONGS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result ? request.result.audioBlob : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getSongData(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE.SONGS_STORE, 'readonly');
    const store = tx.objectStore(STORAGE.SONGS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSong(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE.SONGS_STORE, 'readwrite');
    const store = tx.objectStore(STORAGE.SONGS_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function incrementPlayCount(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE.SONGS_STORE, 'readwrite');
    const store = tx.objectStore(STORAGE.SONGS_STORE);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) { resolve(); return; }
      record.playCount = (record.playCount || 0) + 1;
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

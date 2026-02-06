import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, THEME_FONT, NOTEBOOK, STICKY_NOTE, EMOJI_POOL } from '../config.js';
import AudioManager from '../audio/AudioManager.js';
import { detectBeats, estimateBpm } from '../audio/BeatDetector.js';
import { pageFlipIn, pageFlipOut } from '../effects/PageFlip.js';
import { getAllSongs, getSongBlob, saveSong, sanitizeTitle, incrementPlayCount, deleteSong } from '../storage/SongLibrary.js';
import { getScoreForSong } from '../storage/ScoreStore.js';
import StickyNote from '../ui/StickyNote.js';

export default class SongSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SONG_SELECT);
  }

  create() {
    this.cameras.main.setBackgroundColor(NOTEBOOK.BG_COLOR);
    pageFlipIn(this);

    this.stickyNotes = [];
    this.selectedSongId = null;

    this.drawNotebookGrid();

    this.add.text(GAME_WIDTH / 2, 100, 'MojiBeats', {
      fontSize: '96px',
      fontFamily: THEME_FONT,
      color: '#ec4899'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 190, 'Select a Song', {
      fontSize: '32px',
      fontFamily: THEME_FONT,
      color: '#6b7280'
    }).setOrigin(0.5);

    this.statusText = this.add.text(GAME_WIDTH / 2, 530, '', {
      fontSize: '22px',
      fontFamily: THEME_FONT,
      color: '#6b7280'
    }).setOrigin(0.5);

    this.createUploadButton();
    this.createDropZoneHint();
    this.listenForStickyEvents();
    this.listenForDragDrop();
    this.loadSavedSongs();

    this.input.on('pointerdown', (pointer) => this.onBackgroundClick(pointer));
  }

  createUploadButton() {
    const uploadBtn = this.add.text(GAME_WIDTH / 2, 320, 'Upload MP3', {
      fontSize: '28px',
      fontFamily: THEME_FONT,
      color: '#ffffff',
      backgroundColor: '#6b7280',
      padding: { x: 28, y: 11 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    uploadBtn.on('pointerover', () => uploadBtn.setStyle({ backgroundColor: '#4b5563' }));
    uploadBtn.on('pointerout', () => uploadBtn.setStyle({ backgroundColor: '#6b7280' }));
    uploadBtn.on('pointerdown', () => this.triggerFileUpload());

    this.uploadBtn = uploadBtn;
  }

  createDropZoneHint() {
    this.dropHint = this.add.text(GAME_WIDTH / 2, 390, 'or drag & drop an MP3 here', {
      fontSize: '18px',
      fontFamily: THEME_FONT,
      color: '#9ca3af',
    }).setOrigin(0.5);
  }

  listenForDragDrop() {
    const canvas = this.game.canvas;

    this.dragOverHandler = (e) => {
      e.preventDefault();
      this.dropHint.setColor('#ec4899');
    };

    this.dragLeaveHandler = () => {
      this.dropHint.setColor('#9ca3af');
    };

    this.dropHandler = (e) => {
      e.preventDefault();
      this.dropHint.setColor('#9ca3af');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) {
        this.handleFile(file);
      } else {
        this.statusText.setText('Please drop an MP3 file.');
      }
    };

    canvas.addEventListener('dragover', this.dragOverHandler);
    canvas.addEventListener('dragleave', this.dragLeaveHandler);
    canvas.addEventListener('drop', this.dropHandler);

    this.events.on('shutdown', () => {
      canvas.removeEventListener('dragover', this.dragOverHandler);
      canvas.removeEventListener('dragleave', this.dragLeaveHandler);
      canvas.removeEventListener('drop', this.dropHandler);
    });
  }

  listenForStickyEvents() {
    this.events.on('sticky-select', (songId) => this.onStickySelect(songId));
    this.events.on('sticky-play', (songId) => this.playSavedSong(songId));
    this.events.on('sticky-delete', (songId) => this.onStickyDelete(songId));
  }

  drawNotebookGrid() {
    for (let y = NOTEBOOK.GRID_SPACING; y < GAME_HEIGHT; y += NOTEBOOK.GRID_SPACING) {
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 1, NOTEBOOK.GRID_COLOR, NOTEBOOK.GRID_ALPHA);
    }
    for (let x = NOTEBOOK.GRID_SPACING; x < GAME_WIDTH; x += NOTEBOOK.GRID_SPACING) {
      this.add.rectangle(x, GAME_HEIGHT / 2, 1, GAME_HEIGHT, NOTEBOOK.GRID_COLOR, NOTEBOOK.GRID_ALPHA);
    }
    this.add.rectangle(NOTEBOOK.MARGIN_X, GAME_HEIGHT / 2, 2, GAME_HEIGHT, NOTEBOOK.MARGIN_COLOR, NOTEBOOK.MARGIN_ALPHA);
  }

  async loadSavedSongs() {
    try {
      const songs = await getAllSongs();
      if (songs.length === 0) {
        this.clearStickyNotes();
        return;
      }

      const songsWithScores = songs.map((song) => {
        const score = getScoreForSong(song.id);
        return {
          ...song,
          bestScore: score ? score.bestScore : null,
          grade: score ? score.grade : null,
        };
      });

      this.renderStickyNotes(songsWithScores);
    } catch (err) {
      console.error('[MojiBeats] Failed to load saved songs:', err);
    }
  }

  renderStickyNotes(songs) {
    this.clearStickyNotes();

    const visible = songs.slice(-STICKY_NOTE.MAX_VISIBLE);
    const colors = STICKY_NOTE.COLORS;

    visible.forEach((song, i) => {
      const color = colors[i % colors.length];
      const note = new StickyNote(this, song, color, i);
      this.stickyNotes.push(note);
    });
  }

  clearStickyNotes() {
    for (const note of this.stickyNotes) {
      note.destroy();
    }
    this.stickyNotes = [];
  }

  onStickySelect(songId) {
    this.selectedSongId = songId;

    for (const note of this.stickyNotes) {
      if (note.songData.id === songId) {
        note.select();
      } else {
        note.deselect();
      }
    }
  }

  async onStickyDelete(songId) {
    try {
      await deleteSong(songId);
      this.selectedSongId = null;
      await this.loadSavedSongs();
    } catch (err) {
      console.error('[MojiBeats] Failed to delete song:', err);
    }
  }

  onBackgroundClick(pointer) {
    if (this.selectedSongId === null) return;

    const hitAny = this.stickyNotes.some((note) => {
      const containerBounds = note.container.getBounds();
      if (containerBounds.contains(pointer.x, pointer.y)) return true;
      const playBounds = note.playBtn.getBounds();
      if (playBounds.contains(pointer.x, pointer.y)) return true;
      const delBounds = note.deleteBtn.getBounds();
      if (delBounds.contains(pointer.x, pointer.y)) return true;
      return false;
    });

    if (!hitAny) {
      this.deselectAll();
    }
  }

  deselectAll() {
    this.selectedSongId = null;
    for (const note of this.stickyNotes) {
      note.deselect();
    }
  }

  triggerFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mpeg, audio/mp3';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) this.handleFile(file);
    };
    input.click();
  }

  async handleFile(file) {
    this.statusText.setText('Loading audio...');
    this.uploadBtn.setVisible(false);
    this.dropHint.setVisible(false);

    const audioManager = new AudioManager();

    try {
      await audioManager.loadFile(file);
      this.statusText.setText('Analyzing beats...');

      const channelData = audioManager.getChannelData();
      const sampleRate = audioManager.getSampleRate();
      const beats = detectBeats(channelData, sampleRate);
      const bpm = estimateBpm(beats);

      const title = sanitizeTitle(file.name);
      const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];

      const arrayBuffer = await file.arrayBuffer();
      const audioBlob = new Blob([arrayBuffer], { type: file.type });

      const songId = await saveSong({
        title,
        bpm,
        audioBlob,
        emoji,
        beatCount: beats.length,
      });

      console.log(`[MojiBeats] Song saved: ${title} (id: ${songId})`);
      console.log(`[MojiBeats] Duration: ${audioManager.getDuration().toFixed(1)}s`);
      console.log(`[MojiBeats] Detected ${beats.length} beats`);
      console.log(`[MojiBeats] Estimated BPM: ${bpm.toFixed(1)}`);

      this.statusText.setText(
        `${title}\n${beats.length} beats detected | ~${Math.round(bpm)} BPM`
      );

      pageFlipOut(this, () => {
        this.scene.start(SCENES.GAMEPLAY, { audioManager, beats, bpm, songName: title, songId });
      });
    } catch (err) {
      console.error('[MojiBeats] Audio load error:', err);
      this.statusText.setText('Error loading audio. Try another MP3.');
      this.uploadBtn.setVisible(true);
      this.dropHint.setVisible(true);
    }
  }

  async playSavedSong(songId) {
    this.statusText.setText('Loading song...');
    this.uploadBtn.setVisible(false);
    this.dropHint.setVisible(false);

    try {
      const blob = await getSongBlob(songId);
      if (!blob) {
        this.statusText.setText('Song data not found.');
        this.uploadBtn.setVisible(true);
        this.dropHint.setVisible(true);
        return;
      }

      const audioManager = new AudioManager();
      const arrayBuffer = await blob.arrayBuffer();
      const file = new File([arrayBuffer], 'song.mp3', { type: 'audio/mpeg' });
      await audioManager.loadFile(file);

      this.statusText.setText('Analyzing beats...');

      const channelData = audioManager.getChannelData();
      const sampleRate = audioManager.getSampleRate();
      const beats = detectBeats(channelData, sampleRate);
      const bpm = estimateBpm(beats);

      const note = this.stickyNotes.find((n) => n.songData.id === songId);
      const songName = note ? note.songData.title : 'Unknown';

      await incrementPlayCount(songId);

      pageFlipOut(this, () => {
        this.scene.start(SCENES.GAMEPLAY, { audioManager, beats, bpm, songName, songId });
      });
    } catch (err) {
      console.error('[MojiBeats] Failed to load saved song:', err);
      this.statusText.setText('Error loading song. Try again.');
      this.uploadBtn.setVisible(true);
      this.dropHint.setVisible(true);
    }
  }
}

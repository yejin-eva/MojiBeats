import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, THEME_FONT, THEME, NOTEBOOK, STICKY_NOTE, EMOJI_POOL, YOUTUBE } from '../config.js';
import AudioManager from '../audio/AudioManager.js';
import YouTubePlayer, { extractVideoId } from '../audio/YouTubePlayer.js';
import { detectBeats, estimateBpm } from '../audio/BeatDetector.js';
import { generateYouTubeBeats } from '../gameplay/BeatmapGenerator.js';
import { pageFlipIn, pageFlipOut } from '../effects/PageFlip.js';
import { drawNotebookGrid, scatterDoodles } from '../effects/NotebookBackground.js';
import { getAllSongs, getSongBlob, getSongData, saveSong, sanitizeTitle, incrementPlayCount, deleteSong } from '../storage/SongLibrary.js';
import { getScoreForSong } from '../storage/ScoreStore.js';
import StickyNote from '../ui/StickyNote.js';

export default class SongSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SONG_SELECT);
  }

  init(data) {
    this.retryData = data || {};
  }

  create() {
    this.cameras.main.setBackgroundColor(NOTEBOOK.BG_COLOR);
    pageFlipIn(this);

    this.stickyNotes = [];
    this.selectedSongId = null;

    drawNotebookGrid(this);
    scatterDoodles(this);

    this.add.text(GAME_WIDTH / 2, 100, 'MojiBeats', {
      fontSize: '96px',
      fontFamily: THEME_FONT,
      color: THEME.PRIMARY
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

    this.htmlElements = [];

    this.createUploadButton();
    this.createDropZoneHint();
    this.createYouTubeInput();
    this.listenForStickyEvents();
    this.listenForDragDrop();
    this.loadSavedSongs();

    this.input.on('pointerdown', (pointer) => this.onBackgroundClick(pointer));

    this.events.on('shutdown', () => this.removeHtmlElements());

    if (this.retryData.retrySongId) {
      this.playSavedSong(this.retryData.retrySongId, { minSpacing: this.retryData.retryMinSpacing });
    }
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

  createYouTubeInput() {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      left: ${rect.left + rect.width / 2 - 160}px;
      top: ${rect.top + rect.height * 0.58}px;
      display: flex;
      gap: 6px;
      z-index: 10;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Paste YouTube URL...';
    input.style.cssText = `
      width: 240px;
      padding: 8px 12px;
      border: 2px solid #d4d4d4;
      border-radius: 6px;
      font-family: ${THEME_FONT}, sans-serif;
      font-size: 14px;
      outline: none;
      background: #fffef5;
    `;
    input.addEventListener('focus', () => { input.style.borderColor = THEME.PRIMARY; });
    input.addEventListener('blur', () => { input.style.borderColor = '#d4d4d4'; });

    const btn = document.createElement('button');
    btn.textContent = 'Load';
    btn.style.cssText = `
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      background: ${THEME.PRIMARY};
      color: white;
      font-family: ${THEME_FONT}, sans-serif;
      font-size: 14px;
      cursor: pointer;
    `;
    btn.addEventListener('mouseover', () => { btn.style.background = THEME.PRIMARY_HOVER; });
    btn.addEventListener('mouseout', () => { btn.style.background = THEME.PRIMARY; });

    const submit = () => {
      const url = input.value.trim();
      if (url) {
        input.value = '';
        this.handleYouTubeUrl(url);
      }
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);

    this.ytInputWrapper = wrapper;
    this.htmlElements.push(wrapper);
  }

  showBpmDialog() {
    return new Promise((resolve) => {
      const canvas = this.game.canvas;
      const rect = canvas.getBoundingClientRect();

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: #fffef5;
        border: 3px solid ${THEME.PRIMARY};
        border-radius: 12px;
        padding: 28px;
        text-align: center;
        font-family: ${THEME_FONT}, sans-serif;
      `;

      const label = document.createElement('div');
      label.textContent = 'Enter BPM (tempo)';
      label.style.cssText = 'font-size: 22px; color: #374151; margin-bottom: 16px;';

      const input = document.createElement('input');
      input.type = 'number';
      input.value = YOUTUBE.DEFAULT_BPM;
      input.min = 40;
      input.max = 300;
      input.style.cssText = `
        width: 100px;
        padding: 8px 12px;
        border: 2px solid #d4d4d4;
        border-radius: 6px;
        font-size: 20px;
        text-align: center;
        outline: none;
        font-family: ${THEME_FONT}, sans-serif;
      `;
      input.addEventListener('focus', () => { input.style.borderColor = THEME.PRIMARY; });
      input.addEventListener('blur', () => { input.style.borderColor = '#d4d4d4'; });

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'Confirm';
      confirmBtn.style.cssText = `
        display: block;
        margin: 16px auto 0;
        padding: 8px 24px;
        border: none;
        border-radius: 6px;
        background: ${THEME.PRIMARY};
        color: white;
        font-family: ${THEME_FONT}, sans-serif;
        font-size: 16px;
        cursor: pointer;
      `;
      confirmBtn.addEventListener('mouseover', () => { confirmBtn.style.background = THEME.PRIMARY_HOVER; });
      confirmBtn.addEventListener('mouseout', () => { confirmBtn.style.background = THEME.PRIMARY; });

      const finish = () => {
        const bpm = Math.max(40, Math.min(300, parseInt(input.value, 10) || YOUTUBE.DEFAULT_BPM));
        overlay.remove();
        const idx = this.htmlElements.indexOf(overlay);
        if (idx !== -1) this.htmlElements.splice(idx, 1);
        resolve(bpm);
      };

      confirmBtn.addEventListener('click', finish);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finish();
      });

      dialog.appendChild(label);
      dialog.appendChild(input);
      dialog.appendChild(confirmBtn);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      this.htmlElements.push(overlay);

      input.focus();
      input.select();
    });
  }

  async handleYouTubeUrl(url) {
    const videoId = extractVideoId(url);
    if (!videoId) {
      this.statusText.setText('Invalid YouTube URL.');
      return;
    }

    this.statusText.setText('Loading YouTube video...');
    this.uploadBtn.setVisible(false);
    this.dropHint.setVisible(false);
    if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'none';
    this.showLoadingSpinner();

    try {
      const tempPlayer = new YouTubePlayer();
      await tempPlayer.loadVideo(videoId);

      const title = tempPlayer.getVideoTitle();
      const duration = tempPlayer.getDuration();
      tempPlayer.destroy();

      this.hideLoadingSpinner();

      const bpm = await this.showBpmDialog();

      const beats = generateYouTubeBeats(bpm, duration);

      const songId = await saveSong({
        title,
        bpm,
        emoji: '🎬',
        beatCount: beats.length,
        type: 'youtube',
        youtubeVideoId: videoId,
        duration,
      });

      console.log(`[MojiBeats] YouTube song saved: ${title} (id: ${songId})`);
      console.log(`[MojiBeats] Duration: ${duration.toFixed(1)}s, BPM: ${bpm}`);

      this.statusText.setText('Pick a difficulty!');
      this.uploadBtn.setVisible(true);
      this.dropHint.setVisible(true);
      if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'flex';

      await this.loadSavedSongs();
      this.onStickySelect(songId);
    } catch (err) {
      console.error('[MojiBeats] YouTube load error:', err);
      this.hideLoadingSpinner();
      this.statusText.setText('Error loading YouTube video. Try another URL.');
      this.uploadBtn.setVisible(true);
      this.dropHint.setVisible(true);
      if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'flex';
    }
  }

  removeHtmlElements() {
    for (const el of this.htmlElements) {
      el.remove();
    }
    this.htmlElements = [];
  }

  listenForDragDrop() {
    const canvas = this.game.canvas;

    this.dragOverHandler = (e) => {
      e.preventDefault();
      this.dropHint.setColor(THEME.PRIMARY);
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
    this.events.on('sticky-play', ({ songId, difficulty }) => this.playSavedSong(songId, difficulty));
    this.events.on('sticky-delete', (songId) => this.onStickyDelete(songId));
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

    this.uploadBtn.setVisible(false);
    this.dropHint.setVisible(false);
    if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'none';
  }

  async onStickyDelete(songId) {
    try {
      await deleteSong(songId);
      this.selectedSongId = null;
      this.uploadBtn.setVisible(true);
      this.dropHint.setVisible(true);
      if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'flex';
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
      for (const btn of note.diffBtns) {
        if (btn.getBounds().contains(pointer.x, pointer.y)) return true;
      }
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

    this.uploadBtn.setVisible(true);
    this.dropHint.setVisible(true);
    if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'flex';
  }

  showLoadingSpinner() {
    this.spinnerText = this.add.text(GAME_WIDTH / 2, 480, '🎵', {
      fontSize: '48px',
    }).setOrigin(0.5);

    this.spinnerTween = this.tweens.add({
      targets: this.spinnerText,
      y: 460,
      angle: { from: -15, to: 15 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  hideLoadingSpinner() {
    if (this.spinnerTween) {
      this.spinnerTween.destroy();
      this.spinnerTween = null;
    }
    if (this.spinnerText) {
      this.spinnerText.destroy();
      this.spinnerText = null;
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
    this.showLoadingSpinner();

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

      this.hideLoadingSpinner();
      this.statusText.setText('Pick a difficulty!');
      this.uploadBtn.setVisible(true);
      this.dropHint.setVisible(true);

      await this.loadSavedSongs();
      this.onStickySelect(songId);
    } catch (err) {
      console.error('[MojiBeats] Audio load error:', err);
      this.hideLoadingSpinner();
      this.statusText.setText('Error loading audio. Try another MP3.');
      this.uploadBtn.setVisible(true);
      this.dropHint.setVisible(true);
    }
  }

  async playSavedSong(songId, difficulty) {
    const minSpacing = difficulty ? difficulty.minSpacing : 0.4;

    this.statusText.setText('Loading song...');
    this.uploadBtn.setVisible(false);
    this.dropHint.setVisible(false);
    if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'none';
    this.showLoadingSpinner();

    try {
      const songRecord = await getSongData(songId);
      if (!songRecord) {
        this.statusText.setText('Song data not found.');
        this.uploadBtn.setVisible(true);
        this.dropHint.setVisible(true);
        if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'flex';
        return;
      }

      const note = this.stickyNotes.find((n) => n.songData.id === songId);
      const songName = note ? note.songData.title : songRecord.title || 'Unknown';

      let audioManager, beats, bpm;

      if (songRecord.type === 'youtube') {
        audioManager = new YouTubePlayer();
        await audioManager.loadVideo(songRecord.youtubeVideoId);

        bpm = songRecord.bpm || YOUTUBE.DEFAULT_BPM;
        const duration = audioManager.getDuration();
        beats = generateYouTubeBeats(bpm, duration);
      } else {
        const blob = songRecord.audioBlob;
        if (!blob) {
          this.statusText.setText('Song data not found.');
          this.uploadBtn.setVisible(true);
          this.dropHint.setVisible(true);
          if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'flex';
          return;
        }

        audioManager = new AudioManager();
        const arrayBuffer = await blob.arrayBuffer();
        const file = new File([arrayBuffer], 'song.mp3', { type: 'audio/mpeg' });
        await audioManager.loadFile(file);

        this.statusText.setText('Analyzing beats...');

        const channelData = audioManager.getChannelData();
        const sampleRate = audioManager.getSampleRate();
        beats = detectBeats(channelData, sampleRate);
        bpm = estimateBpm(beats);
      }

      await incrementPlayCount(songId);
      this.hideLoadingSpinner();

      pageFlipOut(this, () => {
        this.scene.start(SCENES.GAMEPLAY, { audioManager, beats, bpm, songName, songId, minSpacing });
      });
    } catch (err) {
      console.error('[MojiBeats] Failed to load saved song:', err);
      this.hideLoadingSpinner();
      this.statusText.setText('Error loading song. Try again.');
      this.uploadBtn.setVisible(true);
      this.dropHint.setVisible(true);
      if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'flex';
    }
  }
}

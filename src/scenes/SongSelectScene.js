import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, THEME_FONT, THEME, NOTEBOOK, STICKY_NOTE, EMOJI_POOL, YOUTUBE, scaleW, scaleH } from '../config.js';
import AudioManager from '../audio/AudioManager.js';
import YouTubePlayer, { extractVideoId } from '../audio/YouTubePlayer.js';
import { analyzeBeats } from '../audio/BeatDetector.js';
import { generateYouTubeBeats } from '../gameplay/BeatmapGenerator.js';
import { pageFlipIn, pageFlipOut } from '../effects/PageFlip.js';
import { drawNotebookGrid, scatterDoodles } from '../effects/NotebookBackground.js';
import { getAllSongs, getSongBlob, getSongData, saveSong, sanitizeTitle, incrementPlayCount, deleteSong } from '../storage/SongLibrary.js';
import { getScoreForSong } from '../storage/ScoreStore.js';
import { getExampleSongs, getExampleSongById, markExampleDeleted } from '../storage/ExampleSongs.js';
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
    this.allSongs = [];
    this.pageStart = 0;
    this.selectedSongId = null;

    drawNotebookGrid(this);
    scatterDoodles(this);

    this.add.text(GAME_WIDTH / 2, scaleH(100), 'MojiBeats', {
      fontSize: `${scaleH(96)}px`,
      fontFamily: THEME_FONT,
      color: THEME.PRIMARY
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, scaleH(190), 'Select a Song', {
      fontSize: `${scaleH(32)}px`,
      fontFamily: THEME_FONT,
      color: '#6b7280'
    }).setOrigin(0.5);

    this.statusText = this.add.text(GAME_WIDTH / 2, scaleH(530), '', {
      fontSize: `${scaleH(22)}px`,
      fontFamily: THEME_FONT,
      color: '#6b7280'
    }).setOrigin(0.5).setDepth(1000);

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
      this.playSavedSong(this.retryData.retrySongId, { minSpacing: this.retryData.retryMinSpacing, sensitivity: this.retryData.retrySensitivity }, this.retryData.retryDifficultyKey);
    }
  }

  createUploadButton() {
    const uploadBtn = this.add.text(GAME_WIDTH / 2, scaleH(320), 'Upload MP3', {
      fontSize: `${scaleH(28)}px`,
      fontFamily: THEME_FONT,
      color: '#ffffff',
      backgroundColor: '#6b7280',
      padding: { x: scaleW(28), y: scaleH(11) }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    uploadBtn.on('pointerover', () => uploadBtn.setStyle({ backgroundColor: '#4b5563' }));
    uploadBtn.on('pointerout', () => uploadBtn.setStyle({ backgroundColor: '#6b7280' }));
    uploadBtn.on('pointerdown', () => this.triggerFileUpload());

    this.uploadBtn = uploadBtn;
  }

  createDropZoneHint() {
    this.dropHint = this.add.text(GAME_WIDTH / 2, scaleH(390), 'or drag & drop an MP3 here', {
      fontSize: `${scaleH(18)}px`,
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
      left: ${rect.left + rect.width / 2 - scaleW(160)}px;
      top: ${rect.top + rect.height * 0.58}px;
      display: flex;
      gap: 6px;
      z-index: 10;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Paste YouTube URL...';
    input.style.cssText = `
      width: ${scaleW(240)}px;
      padding: ${scaleH(8)}px ${scaleW(12)}px;
      border: 2px solid #d4d4d4;
      border-radius: 6px;
      font-family: ${THEME_FONT}, sans-serif;
      font-size: ${scaleH(14)}px;
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
      font-size: ${scaleH(14)}px;
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
    this.events.on('sticky-play', ({ songId, difficulty, difficultyKey }) => this.playSavedSong(songId, difficulty, difficultyKey));
    this.events.on('sticky-delete', (songId) => this.onStickyDelete(songId));
  }

  async loadSavedSongs() {
    try {
      const dbSongs = await getAllSongs();
      const examples = getExampleSongs();
      const songs = [...examples, ...dbSongs];

      if (songs.length === 0) {
        this.clearStickyNotes();
        return;
      }

      const songsWithScores = songs.map((song) => {
        const scores = getScoreForSong(song.id);
        return {
          ...song,
          scores: scores || {},
        };
      });

      this.renderStickyNotes(songsWithScores);
    } catch (err) {
      console.error('[MojiBeats] Failed to load saved songs:', err);
    }
  }

  renderStickyNotes(songs) {
    this.clearStickyNotes();
    this.allSongs = songs;

    if (this.pageStart >= songs.length && songs.length > 0) {
      this.pageStart = Math.max(0, songs.length - STICKY_NOTE.MAX_VISIBLE);
    }

    const visible = songs.slice(this.pageStart, this.pageStart + STICKY_NOTE.MAX_VISIBLE);
    const colors = STICKY_NOTE.COLORS;

    visible.forEach((song, i) => {
      const color = colors[(this.pageStart + i) % colors.length];
      const note = new StickyNote(this, song, color, i);
      this.stickyNotes.push(note);
    });

    this.updatePageArrows();
  }

  updatePageArrows() {
    if (this.leftArrow) { this.leftArrow.destroy(); this.leftArrow = null; }
    if (this.rightArrow) { this.rightArrow.destroy(); this.rightArrow = null; }
    if (this.pageIndicator) { this.pageIndicator.destroy(); this.pageIndicator = null; }

    const total = this.allSongs.length;
    const max = STICKY_NOTE.MAX_VISIBLE;
    if (total <= max) return;

    const { COLLAPSED_Y, WIDTH, FAN_OVERLAP } = STICKY_NOTE;
    const totalWidth = max * (WIDTH - FAN_OVERLAP) + FAN_OVERLAP;
    const leftEdge = (GAME_WIDTH - totalWidth) / 2;
    const rightEdge = leftEdge + totalWidth;
    const arrowY = COLLAPSED_Y;

    if (this.pageStart > 0) {
      this.leftArrow = this.add.text(leftEdge - scaleW(30), arrowY, '<', {
        fontSize: '36px',
        fontFamily: THEME_FONT,
        color: THEME.PRIMARY,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);
      this.leftArrow.on('pointerdown', () => this.pageLeft());
      this.leftArrow.on('pointerover', () => this.leftArrow.setScale(1.3));
      this.leftArrow.on('pointerout', () => this.leftArrow.setScale(1));
    }

    if (this.pageStart + max < total) {
      this.rightArrow = this.add.text(rightEdge + scaleW(30), arrowY, '>', {
        fontSize: '36px',
        fontFamily: THEME_FONT,
        color: THEME.PRIMARY,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);
      this.rightArrow.on('pointerdown', () => this.pageRight());
      this.rightArrow.on('pointerover', () => this.rightArrow.setScale(1.3));
      this.rightArrow.on('pointerout', () => this.rightArrow.setScale(1));
    }

    const currentPage = Math.floor(this.pageStart / max) + 1;
    const totalPages = Math.ceil(total / max);
    this.pageIndicator = this.add.text(GAME_WIDTH / 2, COLLAPSED_Y - STICKY_NOTE.HEIGHT / 2 - scaleH(15), `${currentPage} / ${totalPages}`, {
      fontSize: '14px',
      fontFamily: THEME_FONT,
      color: '#9ca3af',
    }).setOrigin(0.5).setDepth(-1);
  }

  pageLeft() {
    this.deselectAll();
    this.pageStart = Math.max(0, this.pageStart - STICKY_NOTE.MAX_VISIBLE);
    this.renderStickyNotes(this.allSongs);
  }

  pageRight() {
    this.deselectAll();
    this.pageStart = Math.min(this.allSongs.length - 1, this.pageStart + STICKY_NOTE.MAX_VISIBLE);
    this.renderStickyNotes(this.allSongs);
  }

  clearStickyNotes() {
    for (const note of this.stickyNotes) {
      note.destroy();
    }
    this.stickyNotes = [];
    if (this.leftArrow) { this.leftArrow.destroy(); this.leftArrow = null; }
    if (this.rightArrow) { this.rightArrow.destroy(); this.rightArrow = null; }
    if (this.pageIndicator) { this.pageIndicator.destroy(); this.pageIndicator = null; }
  }

  onStickySelect(songId) {
    this.selectedSongId = songId;

    // If the song isn't on the current page, jump to its page
    const visible = this.stickyNotes.some(n => n.songData.id === songId);
    if (!visible && this.allSongs.length > 0) {
      const songIndex = this.allSongs.findIndex(s => s.id === songId);
      if (songIndex !== -1) {
        this.pageStart = Math.floor(songIndex / STICKY_NOTE.MAX_VISIBLE) * STICKY_NOTE.MAX_VISIBLE;
        this.renderStickyNotes(this.allSongs);
      }
    }

    for (const note of this.stickyNotes) {
      if (note.songData.id === songId) {
        note.select();
      } else {
        note.deselect();
      }
    }

    if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'none';
  }

  async onStickyDelete(songId) {
    try {
      const song = this.allSongs.find(s => s.id === songId);
      if (song && song.type === 'example') {
        markExampleDeleted(song.title);
      } else {
        await deleteSong(songId);
      }
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
    if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'flex';
    this.statusText.setText('');
  }

  showLoadingSpinner() {
    this.spinnerText = this.add.text(GAME_WIDTH / 2, scaleH(480), '🎵', {
      fontSize: '48px',
    }).setOrigin(0.5).setDepth(1000);

    this.spinnerTween = this.tweens.add({
      targets: this.spinnerText,
      y: scaleH(460),
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
      const { beats, bpm } = analyzeBeats(channelData, sampleRate);

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

  async playSavedSong(songId, difficulty, difficultyKey) {
    const minSpacing = difficulty ? difficulty.minSpacing : 0.4;
    const sensitivity = difficulty ? difficulty.sensitivity : {};

    this.statusText.setText('Loading song...');
    this.uploadBtn.setVisible(false);
    this.dropHint.setVisible(false);
    if (this.ytInputWrapper) this.ytInputWrapper.style.display = 'none';
    this.showLoadingSpinner();

    try {
      const songRecord = getExampleSongById(songId) || await getSongData(songId);
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

      if (songRecord.type === 'example') {
        const response = await fetch(songRecord.url);
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        audioManager = new AudioManager();
        const file = new File([blob], 'song.mp3', { type: 'audio/mpeg' });
        await audioManager.loadFile(file);

        this.statusText.setText('Analyzing beats...');

        const channelData = audioManager.getChannelData();
        const sampleRate = audioManager.getSampleRate();
        const analysis = analyzeBeats(channelData, sampleRate, sensitivity);
        beats = analysis.beats;
        bpm = analysis.bpm;
      } else if (songRecord.type === 'youtube') {
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
        const analysis = analyzeBeats(channelData, sampleRate, sensitivity);
        beats = analysis.beats;
        bpm = analysis.bpm;
      }

      await incrementPlayCount(songId);
      this.hideLoadingSpinner();

      pageFlipOut(this, () => {
        this.scene.start(SCENES.GAMEPLAY, { audioManager, beats, bpm, songName, songId, minSpacing, sensitivity, difficultyKey });
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

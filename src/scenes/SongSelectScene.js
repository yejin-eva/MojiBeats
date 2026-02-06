import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import AudioManager from '../audio/AudioManager.js';
import { detectBeats, estimateBpm } from '../audio/BeatDetector.js';

export default class SongSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SONG_SELECT);
  }

  create() {
    this.cameras.main.setBackgroundColor('#f5f0ff');

    this.add.text(GAME_WIDTH / 2, 160, 'MojiBeats', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#7c3aed'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 240, 'Select a Song', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#6b7280'
    }).setOrigin(0.5);

    this.statusText = this.add.text(GAME_WIDTH / 2, 520, '', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#6b7280'
    }).setOrigin(0.5);

    this.createUploadButton();
  }

  createUploadButton() {
    const uploadBtn = this.add.text(GAME_WIDTH / 2, 400, 'Upload MP3', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#7c3aed',
      padding: { x: 40, y: 16 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    uploadBtn.on('pointerover', () => uploadBtn.setStyle({ backgroundColor: '#6d28d9' }));
    uploadBtn.on('pointerout', () => uploadBtn.setStyle({ backgroundColor: '#7c3aed' }));
    uploadBtn.on('pointerdown', () => this.triggerFileUpload());

    this.uploadBtn = uploadBtn;
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

    const audioManager = new AudioManager();

    try {
      await audioManager.loadFile(file);
      this.statusText.setText('Analyzing beats...');

      const channelData = audioManager.getChannelData();
      const sampleRate = audioManager.getSampleRate();
      const beats = detectBeats(channelData, sampleRate);
      const bpm = estimateBpm(beats);

      console.log(`[MojiBeats] Song: ${file.name}`);
      console.log(`[MojiBeats] Duration: ${audioManager.getDuration().toFixed(1)}s`);
      console.log(`[MojiBeats] Detected ${beats.length} beats`);
      console.log(`[MojiBeats] Estimated BPM: ${bpm.toFixed(1)}`);
      console.log(`[MojiBeats] Beat timestamps:`, beats);

      this.statusText.setText(
        `${file.name}\n${beats.length} beats detected | ~${Math.round(bpm)} BPM`
      );

      this.scene.start(SCENES.GAMEPLAY, { audioManager, beats, bpm, songName: file.name });
    } catch (err) {
      console.error('[MojiBeats] Audio load error:', err);
      this.statusText.setText('Error loading audio. Try another MP3.');
      this.uploadBtn.setVisible(true);
    }
  }
}

export default class AudioManager {
  constructor() {
    this.context = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.audioBuffer = null;
    this.startTime = 0;
    this.pauseOffset = 0;
    this.playing = false;
  }

  ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    return this.context;
  }

  async loadFile(file) {
    const ctx = this.ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.pauseOffset = 0;
    return this.audioBuffer;
  }

  play() {
    if (!this.audioBuffer || this.playing) return;

    const ctx = this.ensureContext();
    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;

    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;

    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(ctx.destination);

    this.sourceNode.start(0, this.pauseOffset);
    this.startTime = ctx.currentTime - this.pauseOffset;
    this.playing = true;

    this.sourceNode.onended = () => {
      if (this.playing) {
        this.pauseOffset = this.context.currentTime - this.startTime;
      }
      this.playing = false;
    };
  }

  pause() {
    if (!this.playing) return;
    this.pauseOffset = this.getCurrentTime();
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.playing = false;
  }

  stop() {
    if (this.sourceNode) {
      if (this.playing) {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      }
      this.sourceNode = null;
    }
    this.playing = false;
    this.pauseOffset = 0;
    this.startTime = 0;
  }

  getCurrentTime() {
    if (!this.playing) return this.pauseOffset;
    return this.context.currentTime - this.startTime;
  }

  getDuration() {
    if (!this.audioBuffer) return 0;
    return this.audioBuffer.duration;
  }

  getFrequencyData() {
    if (!this.analyserNode) return new Uint8Array(0);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  getChannelData() {
    if (!this.audioBuffer) return new Float32Array(0);
    return this.audioBuffer.getChannelData(0);
  }

  getSampleRate() {
    if (!this.audioBuffer) return 0;
    return this.audioBuffer.sampleRate;
  }
}

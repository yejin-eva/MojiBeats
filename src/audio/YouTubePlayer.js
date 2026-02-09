let apiPromise = null;

export function loadYouTubeAPI() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => resolve();

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });

  return apiPromise;
}

export function extractVideoId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export default class YouTubePlayer {
  constructor() {
    this.player = null;
    this.hiddenDiv = null;
    this.playing = false;
    this.duration = 0;
    this.pauseOffset = 0;
    this.playStartWall = 0;
    this.baselineTime = 0;
    this.lastPolledTime = -1;
  }

  async loadVideo(videoId) {
    await loadYouTubeAPI();

    this.hiddenDiv = document.createElement('div');
    this.hiddenDiv.style.position = 'absolute';
    this.hiddenDiv.style.left = '-9999px';
    document.body.appendChild(this.hiddenDiv);

    const playerDiv = document.createElement('div');
    this.hiddenDiv.appendChild(playerDiv);

    return new Promise((resolve, reject) => {
      this.player = new window.YT.Player(playerDiv, {
        videoId,
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onReady: () => {
            this.duration = this.player.getDuration();
            resolve();
          },
          onStateChange: (e) => this.onStateChange(e),
          onError: (e) => reject(new Error(`YouTube player error: ${e.data}`)),
        },
      });
    });
  }

  onStateChange(event) {
    const state = event.data;
    if (state === window.YT.PlayerState.ENDED) {
      this.playing = false;
    }
  }

  play() {
    if (this.playing) return;
    this.player.seekTo(this.pauseOffset, true);
    this.player.playVideo();
    this.baselineTime = this.pauseOffset;
    this.playStartWall = performance.now();
    this.lastPolledTime = -1;
    this.playing = true;
  }

  pause() {
    if (!this.playing) return;
    this.pauseOffset = this.getCurrentTime();
    this.player.pauseVideo();
    this.playing = false;
  }

  stop() {
    if (this.player) {
      this.player.stopVideo();
    }
    this.playing = false;
    this.pauseOffset = 0;
    this.destroy();
  }

  getCurrentTime() {
    if (!this.playing) return this.pauseOffset;

    if (this.player) {
      const polled = this.player.getCurrentTime();
      if (polled !== this.lastPolledTime) {
        this.lastPolledTime = polled;
        this.baselineTime = polled;
        this.playStartWall = performance.now();
      }
    }

    return this.baselineTime + (performance.now() - this.playStartWall) / 1000;
  }

  getDuration() {
    return this.duration;
  }

  getFrequencyData() {
    return new Uint8Array(0);
  }

  getVideoTitle() {
    if (!this.player) return 'YouTube Video';
    const data = this.player.getVideoData();
    return (data && data.title) || 'YouTube Video';
  }

  destroy() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    if (this.hiddenDiv) {
      this.hiddenDiv.remove();
      this.hiddenDiv = null;
    }
  }
}

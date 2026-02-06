let ctx = null;

function getContext() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(freq, duration, type, volume, rampDown) {
  const c = getContext();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  gain.gain.setValueAtTime(volume, c.currentTime);
  if (rampDown) {
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  }
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

export function playHitSound() {
  const c = getContext();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, c.currentTime);
  osc.frequency.linearRampToValueAtTime(1320, c.currentTime + 0.1);
  gain.gain.setValueAtTime(0.1, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.15);
}

export function playMissSound() {
  playTone(150, 0.15, 'sawtooth', 0.06, true);
}

export function playComboSound() {
  const c = getContext();
  [520, 660, 880].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.06);
    gain.gain.setValueAtTime(0.08, c.currentTime + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.06 + 0.12);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + i * 0.06);
    osc.stop(c.currentTime + i * 0.06 + 0.12);
  });
}

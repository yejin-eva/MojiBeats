const HOP_SIZE = 512;
const FFT_SIZE = 1024;

export function detectBeats(channelData, sampleRate) {
  const flux = computeSpectralFlux(channelData, sampleRate);
  if (flux.length === 0) return [];

  const threshold = computeAdaptiveThreshold(flux);
  const onsets = pickPeaks(flux, threshold, sampleRate);
  return onsets;
}

export function estimateBpm(beats) {
  if (beats.length < 2) return 0;

  const intervals = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i] - beats[i - 1]);
  }

  // Build histogram of intervals mapped to BPM range 60-200
  const binSize = 2;
  const minBpm = 60;
  const maxBpm = 200;
  const numBins = Math.ceil((maxBpm - minBpm) / binSize);
  const bins = new Float64Array(numBins);

  for (const interval of intervals) {
    if (interval <= 0) continue;
    const bpm = 60 / interval;

    // Try the interval and its integer multiples/divisions to find
    // which BPM candidate falls in the typical range
    for (let mult = 1; mult <= 4; mult++) {
      const candidate = bpm / mult;
      if (candidate >= minBpm && candidate <= maxBpm) {
        const bin = Math.floor((candidate - minBpm) / binSize);
        if (bin >= 0 && bin < numBins) bins[bin]++;
      }
      const candidateMult = bpm * mult;
      if (candidateMult >= minBpm && candidateMult <= maxBpm) {
        const bin = Math.floor((candidateMult - minBpm) / binSize);
        if (bin >= 0 && bin < numBins) bins[bin]++;
      }
    }
  }

  let bestBin = 0;
  for (let i = 1; i < numBins; i++) {
    if (bins[i] > bins[bestBin]) bestBin = i;
  }

  if (bins[bestBin] === 0) {
    // Fallback to median
    intervals.sort((a, b) => a - b);
    const median = intervals[Math.floor(intervals.length / 2)];
    return median > 0 ? 60 / median : 0;
  }

  return minBpm + (bestBin + 0.5) * binSize;
}

function computeSpectralFlux(channelData, sampleRate) {
  const numFrames = Math.floor((channelData.length - FFT_SIZE) / HOP_SIZE);
  if (numFrames < 2) return [];

  const flux = [];
  let prevSpectrum = computeMagnitudeSpectrum(channelData, 0);

  for (let i = 1; i < numFrames; i++) {
    const offset = i * HOP_SIZE;
    const spectrum = computeMagnitudeSpectrum(channelData, offset);

    let sum = 0;
    for (let j = 0; j < spectrum.length; j++) {
      const diff = spectrum[j] - prevSpectrum[j];
      if (diff > 0) sum += diff;
    }
    flux.push(sum);

    prevSpectrum = spectrum;
  }

  return flux;
}

function computeMagnitudeSpectrum(channelData, offset) {
  const real = new Float64Array(FFT_SIZE);
  const imag = new Float64Array(FFT_SIZE);

  for (let i = 0; i < FFT_SIZE; i++) {
    const windowVal = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
    real[i] = (channelData[offset + i] || 0) * windowVal;
  }

  fft(real, imag);

  const halfN = FFT_SIZE / 2;
  const magnitudes = new Float64Array(halfN);
  for (let i = 0; i < halfN; i++) {
    magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
  }
  return magnitudes;
}

function computeAdaptiveThreshold(flux) {
  const windowSize = 10;
  const multiplier = 1.5;
  const threshold = new Float64Array(flux.length);

  for (let i = 0; i < flux.length; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(flux.length, i + windowSize + 1);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += flux[j];
    }
    const mean = sum / (end - start);
    threshold[i] = mean * multiplier;
  }

  return threshold;
}

function pickPeaks(flux, threshold, sampleRate) {
  const minInterval = 0.1;
  const peaks = [];

  for (let i = 1; i < flux.length - 1; i++) {
    if (
      flux[i] > threshold[i] &&
      flux[i] > flux[i - 1] &&
      flux[i] >= flux[i + 1]
    ) {
      const timeSec = (i * HOP_SIZE) / sampleRate;
      if (peaks.length === 0 || timeSec - peaks[peaks.length - 1] >= minInterval) {
        peaks.push(timeSec);
      }
    }
  }

  return peaks;
}

function fft(real, imag) {
  const n = real.length;
  if (n <= 1) return;

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }

  // Cooley-Tukey iterative FFT
  for (let len = 2; len <= n; len *= 2) {
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;

      for (let j = 0; j < len / 2; j++) {
        const a = i + j;
        const b = i + j + len / 2;

        const tReal = curReal * real[b] - curImag * imag[b];
        const tImag = curReal * imag[b] + curImag * real[b];

        real[b] = real[a] - tReal;
        imag[b] = imag[a] - tImag;
        real[a] += tReal;
        imag[a] += tImag;

        const newCurReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = newCurReal;
      }
    }
  }
}

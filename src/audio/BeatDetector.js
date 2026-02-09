const HOP_SIZE = 512;
const FFT_SIZE = 2048;

export function detectBeats(channelData, sampleRate) {
  const flux = computeSpectralFlux(channelData, sampleRate);
  if (flux.length === 0) return [];

  const threshold = computeAdaptiveThreshold(flux);
  const onsets = pickPeaks(flux, threshold, sampleRate);
  return onsets;
}

export function analyzeBeats(channelData, sampleRate, sensitivity = {}) {
  const thresholdMultiplier = sensitivity.thresholdMultiplier || 1.8;
  const minPeakInterval = sensitivity.minPeakInterval || 0.15;
  const useGrid = sensitivity.useGrid !== false;

  const bands = computeSpectralFluxBands(channelData, sampleRate);
  if (bands.bass.length === 0) return { beats: [], bpm: 0 };

  const fluxRhythm = combineFlux(bands, 3.0, 0.3, 0.1);
  const fluxFull = combineFlux(bands, 1.5, 1.5, 0.3);

  const threshold = computeAdaptiveThreshold(fluxFull, thresholdMultiplier);
  const onsets = pickPeaks(fluxFull, threshold, sampleRate, minPeakInterval);
  if (onsets.length < 2) return { beats: onsets, bpm: 0 };

  const bpm = estimateBpmFromFlux(fluxRhythm, sampleRate);

  let beats;
  if (useGrid) {
    beats = buildPhaseAlignedGrid(onsets, fluxFull, bpm, sampleRate);
  } else {
    beats = onsets;
  }

  console.log(`[BeatDetector] BPM: ${bpm.toFixed(1)}, onsets: ${onsets.length}, beats: ${beats.length} (grid: ${useGrid})`);
  if (bpm <= 0) return { beats: onsets, bpm: 0 };

  return { beats, bpm };
}

export function estimateBpm(beats) {
  if (beats.length < 2) return 0;

  const intervals = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i] - beats[i - 1]);
  }

  const binSize = 2;
  const minBpm = 60;
  const maxBpm = 200;
  const numBins = Math.ceil((maxBpm - minBpm) / binSize);
  const bins = new Float64Array(numBins);

  for (const interval of intervals) {
    if (interval <= 0) continue;
    const bpm = 60 / interval;

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
    intervals.sort((a, b) => a - b);
    const median = intervals[Math.floor(intervals.length / 2)];
    return median > 0 ? 60 / median : 0;
  }

  return minBpm + (bestBin + 0.5) * binSize;
}

function buildOnsetStrength(flux) {
  const n = flux.length;
  if (n === 0) return new Float64Array(0);

  const osf = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    osf[i] = Math.log1p(flux[i]);
  }

  const smoothed = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (i < 2 || i >= n - 2) {
      smoothed[i] = osf[i];
    } else {
      smoothed[i] = 0.0625 * osf[i - 2] + 0.25 * osf[i - 1] +
        0.375 * osf[i] + 0.25 * osf[i + 1] + 0.0625 * osf[i + 2];
    }
  }

  let mean = 0;
  for (let i = 0; i < n; i++) mean += smoothed[i];
  mean /= n;
  for (let i = 0; i < n; i++) smoothed[i] -= mean;

  for (let i = 0; i < n; i++) {
    if (smoothed[i] < 0) smoothed[i] = 0;
  }

  return smoothed;
}

function estimateBpmFromFlux(flux, sampleRate) {
  if (flux.length < 100) return 0;

  const hopTime = HOP_SIZE / sampleRate;
  const osf = buildOnsetStrength(flux);
  const n = osf.length;

  const minBpm = 60;
  const maxBpm = 200;
  const bpmStep = 0.5;
  const numCandidates = Math.floor((maxBpm - minBpm) / bpmStep) + 1;
  const scores = new Float64Array(numCandidates);

  for (let c = 0; c < numCandidates; c++) {
    const bpm = minBpm + c * bpmStep;
    const periodFrames = 60 / bpm / hopTime;

    const numPhases = 8;
    let bestPhaseScore = -Infinity;

    for (let p = 0; p < numPhases; p++) {
      const phaseOffset = (p / numPhases) * periodFrames;
      let score = 0;
      let numBeats = 0;

      for (let pos = phaseOffset; pos < n; pos += periodFrames) {
        const idx = Math.round(pos);
        if (idx >= 0 && idx < n) {
          score += osf[idx];
          numBeats++;
        }
      }

      if (numBeats > 0) score /= numBeats;
      if (score > bestPhaseScore) bestPhaseScore = score;
    }

    scores[c] = bestPhaseScore;
  }

  let bestIdx = 0;
  for (let i = 1; i < numCandidates; i++) {
    if (scores[i] > scores[bestIdx]) bestIdx = i;
  }

  let bestBpm = minBpm + bestIdx * bpmStep;

  if (bestIdx > 0 && bestIdx < numCandidates - 1) {
    const a = scores[bestIdx - 1];
    const b = scores[bestIdx];
    const c = scores[bestIdx + 1];
    const denom = a - 2 * b + c;
    if (Math.abs(denom) > 1e-10) {
      const delta = 0.5 * (a - c) / denom;
      if (Math.abs(delta) < 1) {
        bestBpm += delta * bpmStep;
      }
    }
  }

  bestBpm = disambiguateOctave(bestBpm, scores, minBpm, bpmStep, numCandidates);
  return bestBpm;
}

function disambiguateOctave(bpm, scores, minBpm, bpmStep, numCandidates) {
  const preferMin = 75;
  const preferMax = 160;
  const inPreferred = bpm >= preferMin && bpm <= preferMax;

  const octaves = [bpm / 2, bpm * 2];
  const bestIdx = Math.round((bpm - minBpm) / bpmStep);
  const bestScore = bestIdx >= 0 && bestIdx < numCandidates ? scores[bestIdx] : 0;

  for (const candidate of octaves) {
    if (candidate < minBpm || candidate > minBpm + (numCandidates - 1) * bpmStep) continue;

    const candidateIdx = Math.round((candidate - minBpm) / bpmStep);
    if (candidateIdx < 0 || candidateIdx >= numCandidates) continue;

    const candidateScore = scores[candidateIdx];
    const candidateInPreferred = candidate >= preferMin && candidate <= preferMax;

    if (candidateInPreferred && !inPreferred && candidateScore >= bestScore * 0.75) {
      return candidate;
    }
    if (candidateScore > bestScore * 1.05) {
      return candidate;
    }
  }

  return bpm;
}

function buildPhaseAlignedGrid(onsets, flux, bpm, sampleRate) {
  const interval = 60 / bpm;
  const snapWindow = interval * 0.4;
  const hopTime = HOP_SIZE / sampleRate;
  const osf = flux.length > 0 ? buildOnsetStrength(flux) : null;
  const first = onsets[0];
  const last = onsets[onsets.length - 1];

  const numPhases = 64;
  let bestPhase = 0;
  let bestScore = -Infinity;

  for (let p = 0; p < numPhases; p++) {
    const offset = (p / numPhases) * interval;
    let score = 0;

    for (let t = first + offset; t <= last; t += interval) {
      if (osf) {
        const fluxIdx = Math.round(t / hopTime);
        if (fluxIdx >= 0 && fluxIdx < osf.length) {
          score += osf[fluxIdx];
        }
      } else {
        for (const onset of onsets) {
          const dist = Math.abs(onset - t);
          if (dist <= snapWindow) {
            score += 1 - (dist / snapWindow);
            break;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestPhase = offset;
    }
  }

  const result = [];
  for (let t = first + bestPhase; t <= last; t += interval) {
    let nearby = false;
    for (const onset of onsets) {
      if (Math.abs(onset - t) <= snapWindow) {
        nearby = true;
        break;
      }
    }
    if (nearby) {
      result.push(t);
    }
  }

  return result;
}

export function quantizeToGrid(onsets, bpm) {
  if (onsets.length === 0 || bpm <= 0) return onsets;
  return buildPhaseAlignedGrid(onsets, [], bpm, 44100);
}

function computeBandWeights(halfN, sampleRate) {
  const weights = new Float64Array(halfN);
  const freqPerBin = sampleRate / FFT_SIZE;

  for (let i = 0; i < halfN; i++) {
    const freq = i * freqPerBin;
    if (freq < 200) {
      weights[i] = 3.0;
    } else if (freq < 2000) {
      weights[i] = 1.0;
    } else {
      weights[i] = 0.2;
    }
  }
  return weights;
}

function computeSpectralFluxBands(channelData, sampleRate) {
  const numFrames = Math.floor((channelData.length - FFT_SIZE) / HOP_SIZE);
  if (numFrames < 2) return { bass: [], mid: [], high: [] };

  const halfN = FFT_SIZE / 2;
  const freqPerBin = sampleRate / FFT_SIZE;

  const bass = [];
  const mid = [];
  const high = [];
  let prevSpectrum = computeMagnitudeSpectrum(channelData, 0);

  for (let i = 1; i < numFrames; i++) {
    const offset = i * HOP_SIZE;
    const spectrum = computeMagnitudeSpectrum(channelData, offset);

    let bassSum = 0, midSum = 0, highSum = 0;
    for (let j = 0; j < spectrum.length; j++) {
      const diff = spectrum[j] - prevSpectrum[j];
      if (diff > 0) {
        const freq = j * freqPerBin;
        if (freq < 200) bassSum += diff;
        else if (freq < 2000) midSum += diff;
        else highSum += diff;
      }
    }
    bass.push(bassSum);
    mid.push(midSum);
    high.push(highSum);

    prevSpectrum = spectrum;
  }

  return { bass, mid, high };
}

function combineFlux(bands, bassW, midW, highW) {
  const n = bands.bass.length;
  const flux = [];
  for (let i = 0; i < n; i++) {
    flux.push(bands.bass[i] * bassW + bands.mid[i] * midW + bands.high[i] * highW);
  }
  return flux;
}

function computeSpectralFlux(channelData, sampleRate) {
  const bands = computeSpectralFluxBands(channelData, sampleRate);
  return combineFlux(bands, 3.0, 1.0, 0.2);
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

function computeAdaptiveThreshold(flux, multiplier = 1.8) {
  const windowSize = 43;
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

function pickPeaks(flux, threshold, sampleRate, minInterval = 0.15) {
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

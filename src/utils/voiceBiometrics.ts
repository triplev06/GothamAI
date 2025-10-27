/**
 * Voice Biometrics Utility
 * Extracts voice features for speaker identification using Web Audio API
 */

export interface VoiceFeatures {
  averagePitch: number;
  pitchVariance: number;
  spectralCentroid: number;
  spectralRolloff: number;
  energyMean: number;
  energyVariance: number;
  zeroCrossingRate: number;
}

/**
 * Extract voice features from an audio blob
 */
export async function extractVoiceFeatures(audioBlob: Blob): Promise<VoiceFeatures> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;

  // Extract features
  const pitch = analyzePitch(channelData, sampleRate);
  const spectral = analyzeSpectralFeatures(channelData, sampleRate);
  const energy = analyzeEnergy(channelData);
  const zcr = analyzeZeroCrossingRate(channelData);

  await audioContext.close();

  return {
    averagePitch: pitch.average,
    pitchVariance: pitch.variance,
    spectralCentroid: spectral.centroid,
    spectralRolloff: spectral.rolloff,
    energyMean: energy.mean,
    energyVariance: energy.variance,
    zeroCrossingRate: zcr,
  };
}

/**
 * Analyze pitch characteristics
 */
function analyzePitch(data: Float32Array, sampleRate: number) {
  const pitches: number[] = [];
  const frameSize = 2048;

  for (let i = 0; i < data.length - frameSize; i += frameSize) {
    const frame = data.slice(i, i + frameSize);
    const pitch = estimatePitch(frame, sampleRate);
    if (pitch > 0) {
      pitches.push(pitch);
    }
  }

  const average = pitches.reduce((a, b) => a + b, 0) / pitches.length;
  const variance = pitches.reduce((sum, pitch) => sum + Math.pow(pitch - average, 2), 0) / pitches.length;

  return { average, variance };
}

/**
 * Simple autocorrelation-based pitch estimation
 */
function estimatePitch(frame: Float32Array, sampleRate: number): number {
  const minPeriod = Math.floor(sampleRate / 500); // Max 500Hz
  const maxPeriod = Math.floor(sampleRate / 80);  // Min 80Hz

  let bestPeriod = 0;
  let bestCorrelation = 0;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let correlation = 0;
    for (let i = 0; i < frame.length - period; i++) {
      correlation += frame[i] * frame[i + period];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
}

/**
 * Analyze spectral features using FFT approximation
 */
function analyzeSpectralFeatures(data: Float32Array, sampleRate: number) {
  const frameSize = 2048;
  const spectrum = computeSpectrum(data.slice(0, frameSize));

  let sumWeightedFreq = 0;
  let sumMagnitude = 0;
  let rolloffThreshold = 0;
  let rolloffFreq = 0;

  for (let i = 0; i < spectrum.length; i++) {
    const magnitude = spectrum[i];
    const frequency = (i * sampleRate) / frameSize;

    sumWeightedFreq += frequency * magnitude;
    sumMagnitude += magnitude;
  }

  const centroid = sumMagnitude > 0 ? sumWeightedFreq / sumMagnitude : 0;

  // Calculate spectral rolloff (frequency below which 85% of energy is contained)
  rolloffThreshold = sumMagnitude * 0.85;
  let cumulativeSum = 0;

  for (let i = 0; i < spectrum.length; i++) {
    cumulativeSum += spectrum[i];
    if (cumulativeSum >= rolloffThreshold) {
      rolloffFreq = (i * sampleRate) / frameSize;
      break;
    }
  }

  return {
    centroid,
    rolloff: rolloffFreq,
  };
}

/**
 * Simple magnitude spectrum computation
 */
function computeSpectrum(frame: Float32Array): Float32Array {
  const spectrum = new Float32Array(frame.length / 2);

  for (let i = 0; i < spectrum.length; i++) {
    spectrum[i] = Math.abs(frame[i]);
  }

  return spectrum;
}

/**
 * Analyze energy characteristics
 */
function analyzeEnergy(data: Float32Array) {
  const frameSize = 2048;
  const energies: number[] = [];

  for (let i = 0; i < data.length - frameSize; i += frameSize) {
    let energy = 0;
    for (let j = i; j < i + frameSize; j++) {
      energy += data[j] * data[j];
    }
    energies.push(energy);
  }

  const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
  const variance = energies.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / energies.length;

  return { mean, variance };
}

/**
 * Analyze zero crossing rate (indicates voicing)
 */
function analyzeZeroCrossingRate(data: Float32Array): number {
  let crossings = 0;

  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      crossings++;
    }
  }

  return crossings / data.length;
}

/**
 * Compare two voice feature sets and return similarity score (0-1)
 */
export function compareVoiceFeatures(features1: VoiceFeatures, features2: VoiceFeatures): number {
  // Normalize and compare each feature
  const weights = {
    averagePitch: 0.25,
    pitchVariance: 0.15,
    spectralCentroid: 0.20,
    spectralRolloff: 0.15,
    energyMean: 0.10,
    energyVariance: 0.10,
    zeroCrossingRate: 0.05,
  };

  let totalSimilarity = 0;

  // Compare each feature (using inverse of normalized difference)
  Object.keys(weights).forEach((key) => {
    const k = key as keyof VoiceFeatures;
    const diff = Math.abs(features1[k] - features2[k]);
    const maxVal = Math.max(features1[k], features2[k]) || 1;
    const similarity = 1 - Math.min(diff / maxVal, 1);
    totalSimilarity += similarity * weights[k];
  });

  return totalSimilarity;
}

/**
 * Average multiple voice feature sets (for enrollment)
 */
export function averageVoiceFeatures(featuresList: VoiceFeatures[]): VoiceFeatures {
  const count = featuresList.length;

  const averaged: VoiceFeatures = {
    averagePitch: 0,
    pitchVariance: 0,
    spectralCentroid: 0,
    spectralRolloff: 0,
    energyMean: 0,
    energyVariance: 0,
    zeroCrossingRate: 0,
  };

  featuresList.forEach((features) => {
    Object.keys(averaged).forEach((key) => {
      const k = key as keyof VoiceFeatures;
      averaged[k] += features[k];
    });
  });

  Object.keys(averaged).forEach((key) => {
    const k = key as keyof VoiceFeatures;
    averaged[k] /= count;
  });

  return averaged;
}

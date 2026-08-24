import { SPECTRAL_BAND_COUNT, type VoiceRecipeV1 } from './types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function estimatePitch(frame: Float32Array, sampleRate: number): { pitch: number; voicing: number } {
  let bestLag = 0;
  let bestCorrelation = 0;
  const minLag = Math.floor(sampleRate / 800);
  const maxLag = Math.min(frame.length - 1, Math.floor(sampleRate / 65));
  for (let lag = minLag; lag <= maxLag; lag += 2) {
    let correlation = 0;
    let energy = 0;
    for (let i = 0; i < frame.length - lag; i += 2) {
      correlation += frame[i] * frame[i + lag];
      energy += frame[i] * frame[i];
    }
    const normalized = energy > 0 ? correlation / energy : 0;
    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
      bestLag = lag;
    }
  }
  return {
    pitch: bestLag ? clamp(sampleRate / bestLag, 0, 1600) : 0,
    voicing: clamp(bestCorrelation, 0, 1),
  };
}

function spectralBands(frame: Float32Array): number[] {
  const bands: number[] = [];
  for (let band = 0; band < SPECTRAL_BAND_COUNT; band += 1) {
    const frequencyBin = 1 + band * 2;
    let real = 0;
    let imaginary = 0;
    for (let index = 0; index < frame.length; index += 2) {
      const angle = (2 * Math.PI * frequencyBin * index) / frame.length;
      real += frame[index] * Math.cos(angle);
      imaginary -= frame[index] * Math.sin(angle);
    }
    bands.push(Math.sqrt(real ** 2 + imaginary ** 2));
  }
  const peak = Math.max(...bands, .00001);
  return bands.map((value) => Math.round(clamp(value / peak, 0, 1) * 1000) / 1000);
}

export function preprocessPcm(input: Float32Array): Float32Array {
  if (!input.length) return new Float32Array();
  const mean = input.reduce((sum, value) => sum + value, 0) / input.length;
  const centered = Float32Array.from(input, (value) => value - mean);
  const threshold = .012;
  let start = 0;
  let end = centered.length - 1;
  while (start < end && Math.abs(centered[start]) < threshold) start += 1;
  while (end > start && Math.abs(centered[end]) < threshold) end -= 1;
  const trimmed = centered.slice(start, end + 1);
  let peak = 0;
  for (const value of trimmed) peak = Math.max(peak, Math.abs(value));
  const scale = peak > .0001 ? Math.min(5, .72 / peak) : 1;
  return Float32Array.from(trimmed, (value, index) => {
    const previous = index ? trimmed[index - 1] : 0;
    return Math.tanh((value - previous * .08) * scale);
  });
}

export function analyzePcmToRecipe(input: Float32Array, sampleRate: number, seed = 20260825): VoiceRecipeV1 {
  const pcm = preprocessPcm(input);
  const safePcm = pcm.length ? pcm : new Float32Array(Math.round(sampleRate * .4));
  const frameRate = 32;
  const frameSize = Math.max(64, Math.round(sampleRate / frameRate));
  const frameCount = Math.max(2, Math.ceil(safePcm.length / frameSize));
  const frames = Array.from({ length: frameCount }, (_, frameIndex) => {
    const start = frameIndex * frameSize;
    const frame = new Float32Array(frameSize);
    frame.set(safePcm.subarray(start, Math.min(start + frameSize, safePcm.length)));
    let squareSum = 0;
    let deltaSum = 0;
    for (let index = 0; index < frame.length; index += 1) {
      squareSum += frame[index] ** 2;
      if (index) deltaSum += Math.abs(frame[index] - frame[index - 1]);
    }
    const amplitude = clamp(Math.sqrt(squareSum / frame.length) * 1.7, 0, 1);
    const pitchInfo = estimatePitch(frame, sampleRate);
    return {
      pitch: Math.round(pitchInfo.pitch * 10) / 10,
      amplitude: Math.round(amplitude * 1000) / 1000,
      voicing: Math.round(pitchInfo.voicing * 1000) / 1000,
      noise: Math.round(clamp(deltaSum / frame.length * 5, 0, 1) * 1000) / 1000,
      spectralBands: spectralBands(frame),
    };
  });
  return {
    version: 1,
    durationMs: clamp(Math.round((safePcm.length / sampleRate) * 1000), 80, 3000),
    frameRate,
    seed,
    frames,
  };
}

export function mergeChunks(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

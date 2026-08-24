import { createSeededRandom } from './prng';
import { DEFAULT_TRANSFORM, type VoiceRecipeV1, type VoiceTransform } from './types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function renderRecipeToPcm(
  recipe: VoiceRecipeV1,
  sampleRate = 24000,
  transform: VoiceTransform = DEFAULT_TRANSFORM,
): Float32Array {
  const playbackDuration = recipe.durationMs / Math.max(0.72, transform.speed);
  const sampleCount = Math.max(1, Math.round((playbackDuration / 1000) * sampleRate));
  const output = new Float32Array(sampleCount);
  const random = createSeededRandom(recipe.seed);
  let phase = 0;
  let previous = 0;
  const pitchScale = 2 ** (clamp(transform.height, -1, 1) * 0.34);

  for (let index = 0; index < sampleCount; index += 1) {
    const sourceTime = (index / sampleRate) * transform.speed;
    const framePosition = clamp(sourceTime * recipe.frameRate, 0, recipe.frames.length - 1.001);
    const frameIndex = Math.floor(framePosition);
    const mix = framePosition - frameIndex;
    const current = recipe.frames[frameIndex];
    const next = recipe.frames[Math.min(frameIndex + 1, recipe.frames.length - 1)];
    const pitch = (current.pitch + (next.pitch - current.pitch) * mix) * pitchScale;
    const amplitude = current.amplitude + (next.amplitude - current.amplitude) * mix;
    const voicing = current.voicing + (next.voicing - current.voicing) * mix;
    const noiseAmount = clamp(current.noise + transform.roughness * 0.22, 0, 1);
    phase += (Math.PI * 2 * Math.max(35, pitch)) / sampleRate;

    const bandTilt = clamp(0.52 + transform.thickness * 0.22, 0.2, 0.85);
    const voiced = Math.sin(phase) + Math.sin(phase * 2) * bandTilt + Math.sin(phase * 3) * current.spectralBands[5] * 0.22;
    const white = random() * 2 - 1;
    const coloredNoise = previous * 0.68 + white * 0.32;
    const raw = amplitude * (voiced * voicing * 0.46 + coloredNoise * noiseAmount * 0.52);
    const highPassed = raw - previous * 0.14;
    previous = raw;
    output[index] = Math.tanh(highPassed * 1.5) * 0.72;
  }

  return output;
}

export function pcmPeak(pcm: Float32Array): number {
  let peak = 0;
  for (const value of pcm) peak = Math.max(peak, Math.abs(value));
  return peak;
}

export function pcmIsDeterministic(recipe: VoiceRecipeV1): boolean {
  const first = renderRecipeToPcm(recipe, 8000);
  const second = renderRecipeToPcm(recipe, 8000);
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

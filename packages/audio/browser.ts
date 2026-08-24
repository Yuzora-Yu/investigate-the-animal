'use client';

import { renderRecipeToPcm } from './synth';
import type { VoiceRecipeV1, VoiceTransform } from './types';

let sharedContext: AudioContext | null = null;
let activeSource: AudioBufferSourceNode | null = null;

export async function unlockAudio(): Promise<AudioContext> {
  sharedContext ??= new AudioContext({ latencyHint: 'interactive' });
  if (sharedContext.state === 'suspended') await sharedContext.resume();
  return sharedContext;
}

export async function playRecipe(recipe: VoiceRecipeV1, transform?: VoiceTransform): Promise<number> {
  const context = await unlockAudio();
  activeSource?.stop();
  const pcm = renderRecipeToPcm(recipe, context.sampleRate, transform);
  const buffer = context.createBuffer(1, pcm.length, context.sampleRate);
  buffer.copyToChannel(new Float32Array(pcm), 0);
  const source = context.createBufferSource();
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 8;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.16;
  source.buffer = buffer;
  source.connect(limiter).connect(context.destination);
  activeSource = source;
  source.start();
  source.addEventListener('ended', () => { if (activeSource === source) activeSource = null; });
  return (pcm.length / context.sampleRate) * 1000;
}

export function stopActiveRecipe(): void {
  activeSource?.stop();
  activeSource = null;
}

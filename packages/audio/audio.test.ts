import { describe, expect, it } from 'vitest';
import { createAnimalRecipe } from './fixtures';
import { pcmIsDeterministic, pcmPeak, renderRecipeToPcm } from './synth';
import { MAX_RECIPE_BYTES, recipeByteSize } from './types';
import { analyzePcmToRecipe } from './analyzer';

describe('VoiceRecipe audio engine', () => {
  it('renders deterministically from recipe and seed', () => {
    expect(pcmIsDeterministic(createAnimalRecipe('cat', 42))).toBe(true);
  });

  it('keeps the output under the safety peak', () => {
    const pcm = renderRecipeToPcm(createAnimalRecipe('crow', 87), 24000, { height: 1, thickness: 1, speed: .72, roughness: 1 });
    expect(pcmPeak(pcm)).toBeLessThanOrEqual(.72);
  });

  it('keeps synthetic fixtures below transport limit', () => {
    expect(recipeByteSize(createAnimalRecipe('cow', 20))).toBeLessThan(MAX_RECIPE_BYTES);
  });

  it('turns silence into a finite safe recipe', () => {
    const recipe = analyzePcmToRecipe(new Float32Array(0), 48000, 5);
    expect(recipe.frames.length).toBeGreaterThan(1);
    expect(recipe.frames.every((frame) => Number.isFinite(frame.pitch))).toBe(true);
  });
});

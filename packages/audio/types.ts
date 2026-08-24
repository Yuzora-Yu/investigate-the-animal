import { z } from 'zod';

export const VOICE_RECIPE_VERSION = 1 as const;
export const MAX_RECIPE_BYTES = 32 * 1024;
export const SPECTRAL_BAND_COUNT = 16;

export const voiceFrameSchema = z.object({
  pitch: z.number().min(0).max(1600),
  amplitude: z.number().min(0).max(1),
  voicing: z.number().min(0).max(1),
  noise: z.number().min(0).max(1),
  spectralBands: z.array(z.number().min(0).max(1)).length(SPECTRAL_BAND_COUNT),
});

export const voiceRecipeSchema = z.object({
  version: z.literal(VOICE_RECIPE_VERSION),
  durationMs: z.number().int().min(80).max(3000),
  frameRate: z.number().int().min(20).max(60),
  seed: z.number().int(),
  frames: z.array(voiceFrameSchema).min(2).max(180),
});

export type VoiceFrame = z.infer<typeof voiceFrameSchema>;
export type VoiceRecipeV1 = z.infer<typeof voiceRecipeSchema>;

export type VoiceTransform = {
  height: number;
  thickness: number;
  speed: number;
  roughness: number;
};

export const DEFAULT_TRANSFORM: VoiceTransform = {
  height: 0,
  thickness: 0,
  speed: 1,
  roughness: 0,
};

export function recipeByteSize(recipe: VoiceRecipeV1): number {
  return new TextEncoder().encode(JSON.stringify(recipe)).byteLength;
}

export function assertRecipeSafe(input: unknown): VoiceRecipeV1 {
  const recipe = voiceRecipeSchema.parse(input);
  if (recipeByteSize(recipe) > MAX_RECIPE_BYTES) {
    throw new Error('VoiceRecipeが32KBをこえています。');
  }
  return recipe;
}

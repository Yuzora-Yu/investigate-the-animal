import { describe, expect, it } from 'vitest';
import { createAnimalRecipe } from '../audio/fixtures';
import { hiderRecipeSubmitSchema } from './protocol';

describe('multiplayer privacy schema', () => {
  it('accepts VoiceRecipe-only submissions', () => {
    expect(hiderRecipeSubmitSchema.safeParse({ type: 'HIDER_RECIPE_SUBMIT', round: 1, animalId: 'cat', recipe: createAnimalRecipe('cat', 9, true) }).success).toBe(true);
  });

  it.each(['blob', 'wav', 'webm', 'pcm', 'playerId', 'sourceType', 'human'])('rejects forbidden field %s', (field) => {
    const payload = { type: 'HIDER_RECIPE_SUBMIT', round: 1, animalId: 'cat', recipe: createAnimalRecipe('cat', 9, true), [field]: 'forbidden' };
    expect(hiderRecipeSubmitSchema.safeParse(payload).success).toBe(false);
  });
});

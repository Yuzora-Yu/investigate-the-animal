import { createAnimalRecipe, type AnimalId } from '../audio/fixtures';
import type { VoiceRecipeV1, VoiceTransform } from '../audio/types';

export type AnimalDefinition = {
  id: AnimalId;
  name: string;
  call: string;
  emoji: string;
  transformBounds: {
    height: [number, number];
    thickness: [number, number];
    speed: [number, number];
    roughness: [number, number];
  };
};

export type InvestigationSlot = {
  animal: AnimalDefinition;
  recipe: VoiceRecipeV1;
};

export const ANIMALS: AnimalDefinition[] = [
  { id: 'cat', name: 'ねこ', call: 'にゃー', emoji: '🐈', transformBounds: { height: [-.45, .45], thickness: [-.35, .3], speed: [.82, 1.18], roughness: [-.15, .25] } },
  { id: 'dog', name: 'いぬ', call: 'わん！', emoji: '🐕', transformBounds: { height: [-.36, .34], thickness: [-.3, .42], speed: [.82, 1.2], roughness: [-.12, .34] } },
  { id: 'cow', name: 'うし', call: 'もー', emoji: '🐄', transformBounds: { height: [-.25, .22], thickness: [-.12, .46], speed: [.8, 1.12], roughness: [-.14, .2] } },
  { id: 'sheep', name: 'ひつじ', call: 'めぇー', emoji: '🐑', transformBounds: { height: [-.32, .4], thickness: [-.28, .32], speed: [.82, 1.2], roughness: [-.1, .28] } },
  { id: 'pig', name: 'ぶた', call: 'ぶーぶー', emoji: '🐖', transformBounds: { height: [-.28, .3], thickness: [-.2, .42], speed: [.85, 1.22], roughness: [-.15, .22] } },
  { id: 'chicken', name: 'にわとり', call: 'コケコッコー', emoji: '🐓', transformBounds: { height: [-.22, .28], thickness: [-.32, .18], speed: [.88, 1.22], roughness: [-.18, .22] } },
  { id: 'crow', name: 'カラス', call: 'カー', emoji: '🐦‍⬛', transformBounds: { height: [-.3, .28], thickness: [-.2, .36], speed: [.82, 1.17], roughness: [-.1, .26] } },
  { id: 'frog', name: 'カエル', call: 'ゲコゲコ', emoji: '🐸', transformBounds: { height: [-.25, .28], thickness: [-.15, .4], speed: [.82, 1.18], roughness: [-.12, .3] } },
];

export function createInvestigation(seed: number): { slots: InvestigationSlot[]; anomalyId: AnimalId } {
  const anomalyIndex = Math.abs(seed) % ANIMALS.length;
  const anomalyId = ANIMALS[anomalyIndex].id;
  const slots = ANIMALS.map((animal, index) => ({
    animal,
    recipe: createAnimalRecipe(animal.id, seed + index * 7919, animal.id === anomalyId),
  }));
  return { slots, anomalyId };
}

export function clampAnimalTransform(animal: AnimalDefinition, transform: VoiceTransform): VoiceTransform {
  const clamp = (value: number, [min, max]: [number, number]) => Math.min(max, Math.max(min, value));
  return {
    height: clamp(transform.height, animal.transformBounds.height),
    thickness: clamp(transform.thickness, animal.transformBounds.thickness),
    speed: clamp(transform.speed, animal.transformBounds.speed),
    roughness: clamp(transform.roughness, animal.transformBounds.roughness),
  };
}

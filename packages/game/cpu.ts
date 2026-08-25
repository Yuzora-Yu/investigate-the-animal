import { createSeededRandom } from '../audio/prng';
import type { VoiceRecipeV1 } from '../audio/types';
import type { AnimalId } from '../audio/fixtures';
import type { InvestigationSlot } from './animals';

export type CpuHearingProfile = {
  pitchWeight: number;
  contourWeight: number;
  timbreWeight: number;
  durationWeight: number;
  noiseWeight: number;
  rhythmWeight: number;
  skill: number;
  confidence: number;
  randomness: number;
};

export type CpuCharacter = {
  id: string;
  name: string;
  icon: string;
  dialogueStyle: string;
  hearingProfile: CpuHearingProfile;
};

export const CPU_CHARACTERS: CpuCharacter[] = [
  { id: 'joseph', name: 'ジョセフ', icon: '/games/investigate-the-animal/prisma/joseph-101.png', dialogueStyle: '声の芯をじっくり聞く。', hearingProfile: { pitchWeight: .8, contourWeight: 1, timbreWeight: 1.1, durationWeight: .8, noiseWeight: .7, rhythmWeight: .9, skill: .72, confidence: .82, randomness: .28 } },
  { id: 'marie', name: 'マリー', icon: '/games/investigate-the-animal/prisma/marie-102.png', dialogueStyle: '音の終わりまで見逃さない。', hearingProfile: { pitchWeight: 1, contourWeight: 1.15, timbreWeight: .9, durationWeight: 1.2, noiseWeight: .75, rhythmWeight: .8, skill: .79, confidence: .88, randomness: .2 } },
  { id: 'zeried', name: 'ゼリード', icon: '/games/investigate-the-animal/prisma/zeried-103.png', dialogueStyle: 'リズムのズレに目ざとい。', hearingProfile: { pitchWeight: .72, contourWeight: .8, timbreWeight: .84, durationWeight: .75, noiseWeight: 1, rhythmWeight: 1.3, skill: .68, confidence: .7, randomness: .34 } },
  { id: 'kate', name: 'ケイト', icon: '/games/investigate-the-animal/prisma/kate-104.png', dialogueStyle: '高い音と波形を分析する。', hearingProfile: { pitchWeight: 1.25, contourWeight: 1.12, timbreWeight: 1.08, durationWeight: .65, noiseWeight: .84, rhythmWeight: .9, skill: .74, confidence: .76, randomness: .3 } },
];

function recipeFeatures(recipe: VoiceRecipeV1) {
  const voiced = recipe.frames.filter((frame) => frame.amplitude > .04);
  const source = voiced.length ? voiced : recipe.frames;
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const pitches = source.map((frame) => frame.pitch).filter(Boolean);
  const pitch = average(pitches);
  const contour = average(pitches.slice(1).map((value, index) => Math.abs(value - pitches[index]))) / Math.max(1, pitch);
  const noise = average(source.map((frame) => frame.noise));
  const timbre = average(source.map((frame) => frame.spectralBands.reduce((sum, band, index) => sum + band * index, 0) / 15));
  const rhythm = average(source.slice(1).map((frame, index) => Math.abs(frame.amplitude - source[index].amplitude)));
  return { pitch, contour, noise, timbre, rhythm, duration: recipe.durationMs };
}

export function scoreSuspicion(slot: InvestigationSlot, references: VoiceRecipeV1[], profile: CpuHearingProfile): number {
  const sample = recipeFeatures(slot.recipe);
  const referenceFeatures = references.map(recipeFeatures);
  const average = (key: keyof typeof sample) => referenceFeatures.reduce((sum, value) => sum + value[key], 0) / Math.max(1, referenceFeatures.length);
  const relative = (key: keyof typeof sample) => Math.abs(sample[key] - average(key)) / Math.max(.01, Math.abs(average(key)));
  return relative('pitch') * profile.pitchWeight + relative('contour') * profile.contourWeight + relative('timbre') * profile.timbreWeight + relative('duration') * profile.durationWeight + relative('noise') * profile.noiseWeight + relative('rhythm') * profile.rhythmWeight;
}

export function cpuSelect(
  slots: InvestigationSlot[],
  references: Record<AnimalId, VoiceRecipeV1[]>,
  cpu: CpuCharacter,
  k: number,
  seed: number,
): { ids: AnimalId[]; scores: Record<AnimalId, number> } {
  const random = createSeededRandom(seed);
  const scored = slots.map((slot) => {
    const base = scoreSuspicion(slot, references[slot.animal.id], cpu.hearingProfile);
    const noise = (random() - .5) * cpu.hearingProfile.randomness * (1.2 - cpu.hearingProfile.skill);
    return { id: slot.animal.id, score: Math.max(0, base + noise) };
  }).sort((a, b) => b.score - a.score);
  return {
    ids: scored.slice(0, k).map(({ id }) => id),
    scores: Object.fromEntries(scored.map(({ id, score }) => [id, score])) as Record<AnimalId, number>,
  };
}

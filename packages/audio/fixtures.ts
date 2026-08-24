import { createSeededRandom } from './prng';
import { SPECTRAL_BAND_COUNT, type VoiceRecipeV1 } from './types';

export type AnimalId = 'cat' | 'dog' | 'cow' | 'sheep' | 'pig' | 'chicken' | 'crow' | 'frog';

type AnimalVoiceProfile = {
  pitch: number;
  durationMs: number;
  noise: number;
  pulseRate: number;
  contour: (progress: number) => number;
  spectralCenter: number;
};

const profiles: Record<AnimalId, AnimalVoiceProfile> = {
  cat: { pitch: 410, durationMs: 1180, noise: .12, pulseRate: 1, contour: (t) => .78 + Math.sin(t * Math.PI) * .5, spectralCenter: 8 },
  dog: { pitch: 185, durationMs: 920, noise: .2, pulseRate: 3, contour: (t) => 1 + Math.sin(t * Math.PI * 6) * .08, spectralCenter: 5 },
  cow: { pitch: 105, durationMs: 1600, noise: .13, pulseRate: 1, contour: (t) => 1.12 - t * .22, spectralCenter: 3 },
  sheep: { pitch: 250, durationMs: 1280, noise: .18, pulseRate: 5, contour: (t) => 1 + Math.sin(t * Math.PI * 10) * .14, spectralCenter: 7 },
  pig: { pitch: 150, durationMs: 820, noise: .46, pulseRate: 4, contour: (t) => .92 + Math.sin(t * Math.PI * 8) * .1, spectralCenter: 6 },
  chicken: { pitch: 510, durationMs: 1050, noise: .25, pulseRate: 7, contour: (t) => .82 + (1 - t) * .38 + Math.sin(t * Math.PI * 8) * .08, spectralCenter: 10 },
  crow: { pitch: 310, durationMs: 1080, noise: .32, pulseRate: 2, contour: (t) => 1.12 - t * .38, spectralCenter: 9 },
  frog: { pitch: 120, durationMs: 1380, noise: .28, pulseRate: 6, contour: (t) => .92 + Math.sin(t * Math.PI * 12) * .05, spectralCenter: 4 },
};

const rounded = (value: number) => Math.round(value * 1000) / 1000;

export function createAnimalRecipe(animalId: AnimalId, seed: number, humanImitation = false): VoiceRecipeV1 {
  const profile = profiles[animalId];
  const random = createSeededRandom(seed);
  const frameRate = 32;
  const frameCount = Math.ceil((profile.durationMs / 1000) * frameRate);
  const humanPitchBias = humanImitation ? .87 + random() * .22 : 1;
  const frames = Array.from({ length: frameCount }, (_, index) => {
    const progress = index / Math.max(1, frameCount - 1);
    const envelope = Math.sin(Math.PI * progress) ** .45;
    const pulse = .42 + .58 * Math.max(0, Math.sin(progress * Math.PI * profile.pulseRate));
    const imitationJitter = humanImitation ? (random() - .5) * .13 : (random() - .5) * .035;
    const spectralBands = Array.from({ length: SPECTRAL_BAND_COUNT }, (_, band) => {
      const distance = (band - profile.spectralCenter - (humanImitation ? .7 : 0)) / 4.2;
      return rounded(Math.max(.035, Math.exp(-(distance ** 2)) * (.76 + random() * .16)));
    });
    return {
      pitch: rounded(profile.pitch * profile.contour(progress) * humanPitchBias * (1 + imitationJitter)),
      amplitude: rounded(Math.min(.82, envelope * pulse * (humanImitation ? .72 : .68))),
      voicing: rounded(Math.max(.15, .88 - profile.noise - (humanImitation ? .04 : 0) + random() * .06)),
      noise: rounded(Math.min(.9, profile.noise + (humanImitation ? .08 : 0) + random() * .05)),
      spectralBands,
    };
  });

  return { version: 1, durationMs: profile.durationMs, frameRate, seed, frames };
}

export const HELP_RECIPE = createAnimalRecipe('cat', 801321, true);

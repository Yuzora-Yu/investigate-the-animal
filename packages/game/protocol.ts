import { z } from 'zod';
import { voiceRecipeSchema } from '../audio/types';

export const ROOM_PHASES = [
  'LOBBY',
  'ROLE_REVEAL',
  'HIDER_PREPARE',
  'HIDER_LOCKED',
  'HUNTING',
  'HUNTER_LOCKED',
  'VOTE_REVEAL',
  'IDENTITY_REVEAL',
  'RESULT',
  'REMATCH',
] as const;

export const roomPhaseSchema = z.enum(ROOM_PHASES);

export const hiderRecipeSubmitSchema = z.object({
  type: z.literal('HIDER_RECIPE_SUBMIT'),
  round: z.number().int().nonnegative(),
  animalId: z.enum(['cat', 'dog', 'cow', 'sheep', 'pig', 'chicken', 'crow', 'frog']),
  recipe: voiceRecipeSchema,
}).strict();

export const hunterSelectionSubmitSchema = z.object({
  type: z.literal('HUNTER_SELECTION_SUBMIT'),
  round: z.number().int().nonnegative(),
  animalIds: z.array(z.enum(['cat', 'dog', 'cow', 'sheep', 'pig', 'chicken', 'crow', 'frog'])).max(3),
}).strict();

export type RoomPhase = z.infer<typeof roomPhaseSchema>;

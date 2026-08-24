import type { AnimalId } from '../audio/fixtures';

export type VoteMap = Record<AnimalId, string[]>;

export type TeamResult = {
  finalAnswer: AnimalId[];
  cutoffTie: boolean;
  investigatorsWin: boolean;
};

export function aggregateVotes(
  selections: Array<{ investigatorId: string; animalIds: AnimalId[] }>,
): VoteMap {
  const initial: VoteMap = { cat: [], dog: [], cow: [], sheep: [], pig: [], chicken: [], crow: [], frog: [] };
  return selections.reduce((votes, selection) => {
    for (const animalId of selection.animalIds) votes[animalId].push(selection.investigatorId);
    return votes;
  }, initial);
}

export function resolveTeamAnswer(votes: VoteMap, anomalyIds: AnimalId[]): TeamResult {
  const k = anomalyIds.length;
  const ranked = (Object.entries(votes) as Array<[AnimalId, string[]]>).sort((a, b) => b[1].length - a[1].length);
  const cutoff = ranked[k - 1]?.[1].length ?? 0;
  const aboveCutoff = ranked.filter(([, voters]) => voters.length > cutoff).length;
  const atCutoff = ranked.filter(([, voters]) => voters.length === cutoff).length;
  const cutoffTie = aboveCutoff < k && aboveCutoff + atCutoff > k;
  const finalAnswer = cutoffTie ? [] : ranked.slice(0, k).map(([animalId]) => animalId);
  const expected = [...anomalyIds].sort();
  const actual = [...finalAnswer].sort();
  return {
    finalAnswer,
    cutoffTie,
    investigatorsWin: !cutoffTie && expected.length === actual.length && expected.every((id, index) => id === actual[index]),
  };
}

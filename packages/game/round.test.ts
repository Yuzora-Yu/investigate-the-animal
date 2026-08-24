import { describe, expect, it } from 'vitest';
import { aggregateVotes, resolveTeamAnswer } from './round';

describe('team vote resolution', () => {
  it('wins only on complete match for K=1', () => {
    const votes = aggregateVotes([{ investigatorId: 'a', animalIds: ['cat'] }]);
    expect(resolveTeamAnswer(votes, ['cat']).investigatorsWin).toBe(true);
    expect(resolveTeamAnswer(votes, ['dog']).investigatorsWin).toBe(false);
  });

  it('handles complete and partial answers for K=2 and K=3', () => {
    const votes = aggregateVotes([
      { investigatorId: 'a', animalIds: ['cat', 'dog', 'frog'] },
      { investigatorId: 'b', animalIds: ['cat', 'dog'] },
      { investigatorId: 'c', animalIds: ['cat'] },
    ]);
    expect(resolveTeamAnswer(votes, ['cat', 'dog']).investigatorsWin).toBe(true);
    expect(resolveTeamAnswer(votes, ['cat', 'cow']).investigatorsWin).toBe(false);
    expect(resolveTeamAnswer(votes, ['cat', 'dog', 'frog']).investigatorsWin).toBe(true);
  });

  it('rejects a cutoff tie instead of random tie-breaking', () => {
    const votes = aggregateVotes([
      { investigatorId: 'a', animalIds: ['cat', 'dog'] },
      { investigatorId: 'b', animalIds: ['cat', 'cow'] },
      { investigatorId: 'c', animalIds: ['cat', 'dog'] },
      { investigatorId: 'd', animalIds: ['cat', 'cow'] },
      { investigatorId: 'e', animalIds: ['dog'] },
      { investigatorId: 'f', animalIds: ['cow'] },
    ]);
    const result = resolveTeamAnswer(votes, ['cat', 'dog']);
    expect(result.cutoffTie).toBe(true);
    expect(result.investigatorsWin).toBe(false);
    expect(result.finalAnswer).toEqual([]);
  });

  it('accepts partial and empty submissions without adding random votes', () => {
    const votes = aggregateVotes([
      { investigatorId: 'a', animalIds: ['cat'] },
      { investigatorId: 'b', animalIds: [] },
    ]);
    expect(votes.cat).toEqual(['a']);
    expect(Object.values(votes).flat()).toEqual(['a']);
  });
});

import { describe, expect, it } from 'vitest';
import { percentileToRank, rankToPercentile } from './percentile';

describe('percentile conversion', () => {
  it('converts percentile to rank', () => {
    expect(percentileToRank(99, 1_200_000)).toBe(12_000);
    expect(percentileToRank(85, 1_200_000)).toBe(180_000);
    expect(percentileToRank(100, 1_200_000)).toBe(1);
  });

  it('converts rank to percentile', () => {
    expect(rankToPercentile(12_000, 1_200_000)).toBeCloseTo(99, 6);
    expect(rankToPercentile(1_200_000, 1_200_000)).toBe(0);
  });
});

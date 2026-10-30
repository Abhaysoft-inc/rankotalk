/**
 * NTA percentile = share of candidates who scored equal to or less than you.
 * So the approximate rank is the share who scored higher, times the number of candidates.
 */
export function percentileToRank(percentile: number, candidates: number): number {
  const rank = Math.ceil(((100 - percentile) / 100) * candidates);
  return Math.max(1, Math.min(candidates, rank));
}

export function rankToPercentile(rank: number, candidates: number): number {
  return Math.max(0, Math.min(100, ((candidates - rank) / candidates) * 100));
}

import type { Chance, CutoffRow, PredictInput, PredictResult } from './types';

// A seat is "safe" when the rank is comfortably inside the closing rank,
// "moderate" when close to it, and "reach" when slightly outside it.
const BANDS = { safe: 0.85, moderate: 1.0, reach: 1.15 } as const;

const HOME_STATE_BOOST = 1.3;
const FEMALE_POOL_BOOST = 1.2;

/** The closing rank that applies to this candidate for this seat group. */
export function applicableClosingRank(row: CutoffRow, input: PredictInput): number {
  let closing = row.closingRank;
  if (row.type === 'NIT' && input.homeState && input.homeState === row.state) closing *= HOME_STATE_BOOST;
  if (input.gender === 'female') closing *= FEMALE_POOL_BOOST;
  return Math.round(closing);
}

export function classify(rank: number, closing: number): Chance | null {
  const ratio = rank / closing;
  if (ratio <= BANDS.safe) return 'safe';
  if (ratio <= BANDS.moderate) return 'moderate';
  if (ratio <= BANDS.reach) return 'reach';
  return null;
}

export function predict(input: PredictInput, rows: CutoffRow[]): PredictResult[] {
  if (!Number.isFinite(input.rank) || input.rank < 1) return [];

  const results: PredictResult[] = [];
  for (const row of rows) {
    if (row.category !== input.category) continue;
    const closingRank = applicableClosingRank(row, input);
    const chance = classify(input.rank, closingRank);
    if (chance) results.push({ ...row, closingRank, chance });
  }
  return results.sort((a, b) => a.closingRank - b.closingRank);
}

export const CATEGORIES = ['OPEN', 'EWS', 'OBC-NCL', 'SC', 'ST'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Gender = 'neutral' | 'female';
export type Chance = 'safe' | 'moderate' | 'reach';
export type InstituteType = 'NIT' | 'IIIT' | 'GFTI' | 'IIT';

/** One past closing rank for one seat group. This is the contract the real data source must match. */
export interface CutoffRow {
  institute: string;
  slug: string;
  type: InstituteType;
  state: string;
  program: string;
  category: Category;
  closingRank: number;
}

export interface PredictInput {
  /** CRL for OPEN, category rank for the other categories. */
  rank: number;
  category: Category;
  gender: Gender;
  homeState?: string;
  exam?: 'main' | 'advanced';
}

export interface PredictResult extends CutoffRow {
  chance: Chance;
}

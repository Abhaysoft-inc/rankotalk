import type { CutoffRow } from './types';

/**
 * The only place the predictor gets its data from.
 * To use the real source, replace the body with a fetch to your backend
 * and return rows in the CutoffRow shape. Nothing else needs to change.
 */
export async function loadCutoffs(exam: 'main' | 'advanced' = 'main'): Promise<CutoffRow[]> {
  if (exam === 'advanced') {
    const mod = await import('../../data/mock-iit-cutoffs.json');
    return mod.default as CutoffRow[];
  }
  const mod = await import('../../data/mock-cutoffs.json');
  return mod.default as CutoffRow[];
}

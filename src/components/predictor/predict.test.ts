import { describe, expect, it } from 'vitest';
import { applicableClosingRank, classify, predict } from './predict';
import type { CutoffRow } from './types';

const row = (over: Partial<CutoffRow> = {}): CutoffRow => ({
  institute: 'Test NIT',
  slug: 'test-nit',
  type: 'NIT',
  state: 'Kerala',
  program: 'Computer Science and Engineering',
  category: 'OPEN',
  closingRank: 10000,
  ...over,
});

describe('classify', () => {
  it('returns safe, moderate, reach and null by ratio', () => {
    expect(classify(8000, 10000)).toBe('safe');
    expect(classify(9500, 10000)).toBe('moderate');
    expect(classify(10000, 10000)).toBe('moderate');
    expect(classify(11000, 10000)).toBe('reach');
    expect(classify(12000, 10000)).toBeNull();
  });
});

describe('applicableClosingRank', () => {
  it('widens for home state at an NIT only', () => {
    expect(applicableClosingRank(row(), { rank: 1, category: 'OPEN', gender: 'neutral', homeState: 'Kerala' })).toBe(13000);
    expect(applicableClosingRank(row(), { rank: 1, category: 'OPEN', gender: 'neutral', homeState: 'Punjab' })).toBe(10000);
    expect(
      applicableClosingRank(row({ type: 'IIIT' }), { rank: 1, category: 'OPEN', gender: 'neutral', homeState: 'Kerala' }),
    ).toBe(10000);
  });

  it('widens for the female pool', () => {
    expect(applicableClosingRank(row(), { rank: 1, category: 'OPEN', gender: 'female' })).toBe(12000);
  });
});

describe('predict', () => {
  const rows = [
    row({ closingRank: 5000 }),
    row({ slug: 'b', closingRank: 20000 }),
    row({ slug: 'c', category: 'SC', closingRank: 900 }),
  ];

  it('only returns rows for the selected category', () => {
    const out = predict({ rank: 4000, category: 'SC', gender: 'neutral' }, rows);
    expect(out).toHaveLength(0);
    const sc = predict({ rank: 800, category: 'SC', gender: 'neutral' }, rows);
    expect(sc.map((r) => r.slug)).toEqual(['c']);
  });

  it('sorts by closing rank and drops seats that are out of reach', () => {
    const out = predict({ rank: 4800, category: 'OPEN', gender: 'neutral' }, rows);
    expect(out.map((r) => r.closingRank)).toEqual([5000, 20000]);
    expect(out[0].chance).toBe('moderate');
    expect(out[1].chance).toBe('safe');
  });

  it('returns nothing for invalid ranks', () => {
    expect(predict({ rank: 0, category: 'OPEN', gender: 'neutral' }, rows)).toEqual([]);
    expect(predict({ rank: NaN, category: 'OPEN', gender: 'neutral' }, rows)).toEqual([]);
  });
});

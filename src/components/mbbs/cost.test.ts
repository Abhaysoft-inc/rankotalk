import { describe, expect, it } from 'vitest';
import { calculateCost, toLakh } from './cost';
import type { CostInput } from './cost';

// The worked example published on /mbbs-abroad/cost-calculator.
const example: CostInput = {
  years: 6,
  rate: 85,
  tuition: 4000,
  hostel: 1200,
  living: 1300,
  insurance: 0,
  oneTimeForeign: 1000,
  oneTimeInr: 50000,
  flightsPerYear: 1,
  flightCostInr: 40000,
  feeIncreasePct: 0,
  rupeeFallPct: 0,
};

describe('calculateCost', () => {
  it('matches the worked example with steady fees and currency', () => {
    const r = calculateCost(example);
    expect(r.total).toBe(3690000);
    expect(toLakh(r.total)).toBe('36.90');
    expect(r.tuition).toBe(4000 * 85 * 6);
    expect(r.travel).toBe(240000);
    expect(r.oneTime).toBe(135000);
    expect(r.years).toHaveLength(6);
  });

  it('matches the worked example when the rupee falls 4% a year', () => {
    const r = calculateCost({ ...example, rupeeFallPct: 4 });
    expect(r.total).toBeCloseTo(4039716, -1);
    expect(toLakh(r.total)).toBe('40.40');
  });

  it('applies the yearly increase from the second year', () => {
    const r = calculateCost({ ...example, years: 2, feeIncreasePct: 10 });
    expect(r.years[0].tuition).toBe(340000);
    expect(r.years[1].tuition).toBeCloseTo(374000, 6);
  });

  it('treats rupee fees with a rate of 1', () => {
    const r = calculateCost({ ...example, rate: 1, tuition: 300000, hostel: 0, living: 0, oneTimeForeign: 0, oneTimeInr: 0, flightsPerYear: 0 });
    expect(r.total).toBe(1800000);
  });
});

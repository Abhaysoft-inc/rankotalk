import { describe, expect, it } from 'vitest';
import { calculateLoan, emi } from './loan';
import type { LoanInput } from './loan';

const base: LoanInput = {
  amount: 1000000,
  ratePct: 10,
  studyYears: 6,
  graceMonths: 6,
  repayYears: 10,
  disbursal: 'upfront',
  studyInterest: 'pay',
};

describe('emi', () => {
  it('matches the standard EMI formula', () => {
    expect(emi(1000000, 10, 120)).toBeCloseTo(13215.07, 1);
    expect(emi(120000, 0, 12)).toBe(10000);
  });
});

describe('calculateLoan', () => {
  it('keeps the principal when study interest is paid monthly', () => {
    const r = calculateLoan(base);
    expect(r.moratoriumMonths).toBe(78);
    expect(r.studyInterest).toBeCloseTo(1000000 * 0.1 / 12 * 78, 6);
    expect(r.repayPrincipal).toBe(1000000);
    expect(r.emi).toBeCloseTo(13215.07, 1);
  });

  it('adds study interest to the loan when it is not paid', () => {
    const r = calculateLoan({ ...base, studyInterest: 'add' });
    expect(r.repayPrincipal).toBeCloseTo(1650000, 6);
    expect(r.emi).toBeCloseTo(emi(1650000, 10, 120), 6);
    expect(r.totalPaid).toBeCloseTo(r.emi * 120, 4);
  });

  it('matches the worked example published on the page', () => {
    const paid = calculateLoan(base);
    expect(Math.round(paid.studyInterest / 78)).toBe(8333);
    expect((paid.totalPaid / 100000).toFixed(2)).toBe('22.36');
    const added = calculateLoan({ ...base, studyInterest: 'add' });
    expect(Math.round(added.emi)).toBe(21805);
    expect((added.totalPaid / 100000).toFixed(2)).toBe('26.17');
  });

  it('charges less study interest when the loan is paid out yearly', () => {
    const upfront = calculateLoan(base).studyInterest;
    const yearly = calculateLoan({ ...base, disbursal: 'yearly' }).studyInterest;
    expect(yearly).toBeLessThan(upfront);
    // Six parts of 1,66,667 outstanding for 78, 66, 54, 42, 30 and 18 months.
    expect(yearly).toBeCloseTo((1000000 / 6) * (0.1 / 12) * (78 + 66 + 54 + 42 + 30 + 18), 6);
  });
});

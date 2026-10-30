import { describe, expect, it } from 'vitest';
import { checkUniversity, rank } from './check';
import type { University } from './check';

const good = (over: Partial<University> = {}): University => ({
  name: 'Test University',
  country: 'Testland',
  courseMonths: 60,
  internshipMonths: 12,
  internshipPlace: 'same',
  medium: 'english',
  licence: 'yes',
  sameInstitution: 'yes',
  wdoms: 'yes',
  nmcAdvisory: 'no',
  totalCostLakh: 30,
  ...over,
});

describe('checkUniversity', () => {
  it('passes a course that meets every rule', () => {
    const r = checkUniversity(good(), 40);
    expect(r.status).toBe('meets');
    expect(r.issues).toHaveLength(0);
    expect(r.overBudget).toBe(false);
  });

  it('fails each NMC rule on its own', () => {
    expect(checkUniversity(good({ courseMonths: 48 })).status).toBe('fails');
    expect(checkUniversity(good({ internshipMonths: 6 })).status).toBe('fails');
    expect(checkUniversity(good({ internshipPlace: 'elsewhere' })).status).toBe('fails');
    expect(checkUniversity(good({ medium: 'mixed' })).status).toBe('fails');
    expect(checkUniversity(good({ licence: 'no' })).status).toBe('fails');
    expect(checkUniversity(good({ sameInstitution: 'no' })).status).toBe('fails');
    expect(checkUniversity(good({ nmcAdvisory: 'yes' })).status).toBe('fails');
  });

  it('accepts exactly 54 months and 12 months', () => {
    expect(checkUniversity(good({ courseMonths: 54, internshipMonths: 12 })).status).toBe('meets');
  });

  it('asks to check unknowns instead of passing them', () => {
    const r = checkUniversity(good({ courseMonths: undefined, medium: 'unsure', licence: 'unsure' }));
    expect(r.status).toBe('check');
    expect(r.issues.filter((i) => i.level === 'unknown')).toHaveLength(3);
  });

  it('treats a missing WDOMS listing as a warning, not a rule failure', () => {
    const r = checkUniversity(good({ wdoms: 'no' }));
    expect(r.status).toBe('meets');
    expect(r.issues[0].level).toBe('warn');
  });

  it('flags cost above budget', () => {
    const r = checkUniversity(good({ totalCostLakh: 50 }), 40);
    expect(r.overBudget).toBe(true);
    expect(r.issues.some((i) => i.text.includes('above your budget'))).toBe(true);
    expect(checkUniversity(good({ totalCostLakh: undefined }), 40).overBudget).toBeNull();
  });
});

describe('rank', () => {
  it('orders by status, then budget, then cost', () => {
    const items = [
      good({ name: 'A', courseMonths: 48 }),
      good({ name: 'B', totalCostLakh: 45 }),
      good({ name: 'C', totalCostLakh: 35 }),
      good({ name: 'D', medium: 'unsure', totalCostLakh: 20 }),
    ].map((uni) => ({ uni, result: checkUniversity(uni, 40) }));
    expect(rank(items).map((i) => i.uni.name)).toEqual(['C', 'B', 'D', 'A']);
  });
});

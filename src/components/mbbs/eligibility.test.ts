import { describe, expect, it } from 'vitest';
import { ageOnDec31, checkAdmission, checkFmg, overall } from './eligibility';
import type { AdmissionInput, FmgInput } from './eligibility';

const student = (over: Partial<AdmissionInput> = {}): AdmissionInput => ({
  dob: '2009-12-31',
  admissionYear: 2026,
  physics: true,
  chemistry: true,
  biology: true,
  english: true,
  pcbPercent: 72,
  category: 'general',
  neet: 'yes',
  passport: 'yes',
  ...over,
});

const graduate = (over: Partial<FmgInput> = {}): FmgInput => ({
  joinedAfterFmgl: 'yes',
  courseMonths: 60,
  internshipMonths: 12,
  internshipSame: 'yes',
  english: 'yes',
  licence: 'yes',
  sameInstitution: 'yes',
  practicalsInPerson: 'yes',
  within10Years: 'yes',
  ...over,
});

describe('ageOnDec31', () => {
  it('counts age on 31 December, so a 31 December birthday still counts', () => {
    expect(ageOnDec31('2009-12-31', 2026)).toBe(17);
    expect(ageOnDec31('2010-01-01', 2026)).toBe(16);
    expect(ageOnDec31('not a date', 2026)).toBeNull();
  });
});

describe('checkAdmission', () => {
  it('passes a student who meets every rule', () => {
    expect(overall(checkAdmission(student()))).toBe('eligible');
  });

  it('fails on age, subjects or NEET', () => {
    expect(overall(checkAdmission(student({ dob: '2010-03-01' })))).toBe('not-eligible');
    expect(overall(checkAdmission(student({ english: false })))).toBe('not-eligible');
    expect(overall(checkAdmission(student({ neet: 'no' })))).toBe('not-eligible');
  });

  it('asks to confirm marks below the commonly stated minimum instead of failing', () => {
    const checks = checkAdmission(student({ pcbPercent: 45 }));
    expect(checks.find((c) => c.label === 'Class 12 marks')?.status).toBe('confirm');
    expect(overall(checks)).toBe('check');
    expect(overall(checkAdmission(student({ pcbPercent: 45, category: 'reserved' })))).toBe('eligible');
  });

  it('treats a pending NEET result or passport as check, not fail', () => {
    expect(overall(checkAdmission(student({ neet: 'awaiting' })))).toBe('check');
    expect(overall(checkAdmission(student({ passport: 'no' })))).toBe('check');
  });
});

describe('checkFmg', () => {
  it('passes a course that meets FMGL 2021', () => {
    expect(overall(checkFmg(graduate()))).toBe('eligible');
  });

  it('fails on each FMGL rule', () => {
    expect(overall(checkFmg(graduate({ courseMonths: 48 })))).toBe('not-eligible');
    expect(overall(checkFmg(graduate({ internshipSame: 'no' })))).toBe('not-eligible');
    expect(overall(checkFmg(graduate({ english: 'no' })))).toBe('not-eligible');
    expect(overall(checkFmg(graduate({ practicalsInPerson: 'no' })))).toBe('not-eligible');
    expect(overall(checkFmg(graduate({ within10Years: 'no' })))).toBe('not-eligible');
  });

  it('points students who joined before 18 November 2021 to the earlier rules', () => {
    const checks = checkFmg(graduate({ joinedAfterFmgl: 'no', courseMonths: 40 }));
    expect(checks).toHaveLength(1);
    expect(checks[0].detail).toContain('earlier regulations');
  });
});

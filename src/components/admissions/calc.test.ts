import { describe, expect, it } from 'vitest';
import { actToSat, assess, scorePosition, selectivityBand, summarize, toSatScale } from './calc';
import type { College, Student } from './calc';

const sat = (score: number, over: Partial<Student> = {}): Student => ({ test: 'sat', score, profile: 'typical', ...over });
const college = (acceptanceRate: number, low?: number, high?: number): College => ({ name: 'Test', acceptanceRate, low, high });

describe('concordance', () => {
  it('matches the official ACT to SAT table', () => {
    expect(actToSat(36)).toBe(1590);
    expect(actToSat(30)).toBe(1370);
    expect(actToSat(21)).toBe(1080);
    expect(actToSat(9)).toBe(590);
    expect(actToSat(40)).toBeNull();
  });

  it('validates score ranges', () => {
    expect(toSatScale('sat', 1250)).toBe(1250);
    expect(toSatScale('sat', 1700)).toBeNull();
    expect(toSatScale('act', 28)).toBe(1310);
    expect(toSatScale('act', 28.5)).toBeNull();
    expect(toSatScale('none', 1200)).toBeNull();
  });
});

describe('bands and positions', () => {
  it('sorts acceptance rates into bands', () => {
    expect(selectivityBand(5)).toBe('most');
    expect(selectivityBand(20)).toBe('highly');
    expect(selectivityBand(45)).toBe('selective');
    expect(selectivityBand(75)).toBe('less');
  });

  it('places a score against the middle 50% range', () => {
    expect(scorePosition(1400, 1200, 1400)).toBe('above');
    expect(scorePosition(1350, 1200, 1400)).toBe('upper');
    expect(scorePosition(1250, 1200, 1400)).toBe('lower');
    expect(scorePosition(1150, 1200, 1400)).toBe('below');
    expect(scorePosition(1000, 1200, 1400)).toBe('far-below');
  });
});

describe('assess', () => {
  it('keeps the most selective colleges as reach even with top scores', () => {
    const r = assess(sat(1600, { profile: 'outstanding' }), college(5, 1500, 1570));
    expect(r.fit).toBe('reach');
  });

  it('caps highly selective colleges at target', () => {
    expect(assess(sat(1500, { profile: 'outstanding' }), college(25, 1300, 1450)).fit).toBe('target');
  });

  it('uses the matrix for selective and less selective colleges', () => {
    expect(assess(sat(1300), college(45, 1150, 1300)).fit).toBe('likely');
    expect(assess(sat(1200), college(45, 1150, 1300)).fit).toBe('target');
    expect(assess(sat(1050), college(45, 1150, 1300)).fit).toBe('reach');
    expect(assess(sat(1100), college(80, 1150, 1300)).fit).toBe('target');
  });

  it('converts ACT ranges and scores', () => {
    const r = assess({ test: 'act', score: 30, profile: 'typical' }, college(45, 25, 30));
    expect(r.position).toBe('above');
    expect(r.fit).toBe('likely');
  });

  it('falls back to acceptance rate without scores', () => {
    expect(assess({ test: 'none', profile: 'typical' }, college(45)).fit).toBe('target');
    expect(assess(sat(1300), college(70)).fit).toBe('likely');
  });

  it('applies GPA and profile modifiers', () => {
    expect(assess(sat(1200, { gpa: 2.8 }), college(45, 1150, 1300)).fit).toBe('reach');
    expect(assess(sat(1200, { profile: 'outstanding' }), college(45, 1150, 1300)).fit).toBe('likely');
    expect(assess(sat(1300, { profile: 'below' }), college(45, 1150, 1300)).fit).toBe('target');
  });
});

describe('summarize', () => {
  it('flags reach-heavy and short lists', () => {
    const advice = summarize(['reach', 'reach', 'target']);
    expect(advice.some((a) => a.includes('8 to 12'))).toBe(true);
    expect(advice.some((a) => a.includes('Likely'))).toBe(true);
    expect(advice.some((a) => a.includes('More than half'))).toBe(true);
  });

  it('approves a balanced list', () => {
    const advice = summarize(['reach', 'reach', 'target', 'target', 'target', 'likely', 'likely', 'likely']);
    expect(advice).toEqual(['Your list has a healthy mix of Reach, Target and Likely colleges.']);
  });
});

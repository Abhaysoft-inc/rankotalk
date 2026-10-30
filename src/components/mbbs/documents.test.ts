import { describe, expect, it } from 'vitest';
import { ALL_IDS, STAGES, progress } from './documents';

describe('document checklist', () => {
  it('has unique item ids', () => {
    expect(new Set(ALL_IDS).size).toBe(ALL_IDS.length);
  });

  it('includes the records NMC rules call for after graduating', () => {
    const ret = STAGES.find((s) => s.id === 'return')!.items.map((i) => i.id);
    expect(ret).toEqual(expect.arrayContaining(['internship', 'licence', 'online-cert']));
  });

  it('computes progress and ignores unknown ids', () => {
    expect(progress(new Set())).toBe(0);
    expect(progress(new Set(ALL_IDS))).toBe(100);
    expect(progress(new Set(['a', 'b']), ['a', 'b', 'c', 'd'])).toBe(50);
    expect(progress(new Set(['zzz']), ['a'])).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { cleanPath } from './url';

describe('cleanPath', () => {
  it('removes .html and index from build-time paths', () => {
    expect(cleanPath('/index.html')).toBe('/');
    expect(cleanPath('/about.html')).toBe('/about');
    expect(cleanPath('/guides/josaa-counselling-process.html')).toBe('/guides/josaa-counselling-process');
    expect(cleanPath('/guides/index.html')).toBe('/guides');
  });

  it('leaves clean paths alone and trims a trailing slash', () => {
    expect(cleanPath('/')).toBe('/');
    expect(cleanPath('/about')).toBe('/about');
    expect(cleanPath('/about/')).toBe('/about');
  });
});

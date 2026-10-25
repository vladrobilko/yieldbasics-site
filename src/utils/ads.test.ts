import { describe, expect, it } from 'vitest';

import { aAdsUnitUrl } from '~/utils/ads';

describe('aAdsUnitUrl', () => {
  it('builds the adaptive iframe URL for a numeric unit ID', () => {
    expect(aAdsUnitUrl('2412345')).toBe('https://acceptable.a-ads.com/2412345/?size=Adaptive');
    expect(aAdsUnitUrl(' 2412345 ')).toBe('https://acceptable.a-ads.com/2412345/?size=Adaptive');
  });

  it('returns null for an empty or malformed ID so the bar stays hidden', () => {
    expect(aAdsUnitUrl('')).toBeNull();
    expect(aAdsUnitUrl('abc')).toBeNull();
    expect(aAdsUnitUrl('123/../x')).toBeNull();
  });
});

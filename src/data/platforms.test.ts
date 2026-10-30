import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getPlatform, platformKindLabels, platformSlug, platforms } from '~/data/platforms';

describe('platforms', () => {
  it('has unique ids', () => {
    expect(new Set(platforms.map((p) => p.id)).size).toBe(platforms.length);
  });

  it('uses a known kind for every platform', () => {
    expect(platforms.every((p) => p.kind in platformKindLabels)).toBe(true);
  });

  it('uses https for every website and referral link', () => {
    for (const p of platforms) {
      expect(new URL(p.website).protocol, p.id).toBe('https:');
      expect(new URL(p.referralUrl).protocol, p.id).toBe('https:');
    }
  });

  it('keeps tracking parameters out of referral links', () => {
    for (const p of platforms) {
      const keys = [...new URL(p.referralUrl).searchParams.keys()];
      expect(
        keys.filter((key) => key.startsWith('utm_')),
        p.id
      ).toEqual([]);
    }
  });

  it('gives every platform a logo', () => {
    expect(platforms.filter((p) => !p.logo).map((p) => p.id)).toEqual([]);
  });

  it('every local platform logo has a file in src/assets/icons', () => {
    for (const p of platforms) {
      if (p.logo && !p.logo.includes(':')) expect(existsSync(`src/assets/icons/${p.logo}.svg`), p.id).toBe(true);
    }
  });

  it('looks platforms up by id and rejects unknown ids', () => {
    expect(getPlatform('okx').name).toBe('OKX');
    expect(() => getPlatform('nope')).toThrow('Unknown platform id: nope');
  });
});

describe('platform profiles', () => {
  it('gives every platform a sourced profile with a valid check date', () => {
    for (const p of platforms) {
      expect(p.profile, p.id).toBeDefined();
      const profile = p.profile!;
      expect(profile.summary.length, p.id).toBeGreaterThan(80);
      expect(profile.sources.length, p.id).toBeGreaterThan(0);
      for (const source of profile.sources) expect(new URL(source.url).protocol, p.id).toBe('https:');
      if (profile.proofOfReserves) expect(new URL(profile.proofOfReserves).protocol, p.id).toBe('https:');
      expect(profile.checkedAt, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(profile.checkedAt)), p.id).toBe(false);
    }
  });

  it('gives every platform a unique page slug', () => {
    const slugs = platforms.map(platformSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => /^[a-z0-9-]+$/.test(slug))).toBe(true);
    expect(platformSlug(getPlatform('telegram-wallet'))).toBe('walt');
  });
});

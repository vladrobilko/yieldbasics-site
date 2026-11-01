import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  getPlatform,
  platformKindLabels,
  platformSlug,
  platforms,
  PROFILE_MAX_AGE_DAYS,
  staleProfiles,
} from '~/data/platforms';

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

describe('staleProfiles', () => {
  const profile = { summary: '', facts: [], sources: [] };
  const list = [
    { ...platforms[0], name: 'Fresh', profile: { ...profile, checkedAt: '2026-10-01' } },
    { ...platforms[0], name: 'Old', profile: { ...profile, checkedAt: '2026-06-01' } },
    { ...platforms[0], name: 'Older', profile: { ...profile, checkedAt: '2026-01-01' } },
    { ...platforms[0], name: 'None', profile: undefined },
  ];

  it('lists profiles older than the limit, oldest first', () => {
    expect(staleProfiles(list, new Date('2026-11-01T00:00:00Z')).map((p) => p.name)).toEqual(['Older', 'Old']);
  });

  it('keeps a profile exactly at the limit', () => {
    const now = new Date(Date.parse('2026-10-01') + PROFILE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    expect(staleProfiles(list, now).map((p) => p.name)).toEqual(['Older', 'Old']);
  });
});

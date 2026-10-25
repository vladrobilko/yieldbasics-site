import { describe, expect, it } from 'vitest';

import { isActiveLink } from '~/utils/navigation';

describe('isActiveLink', () => {
  it('matches the link page itself, with or without trailing slashes', () => {
    expect(isActiveLink('/', '/')).toBe(true);
    expect(isActiveLink('/about/', '/about')).toBe(true);
  });

  it('matches pages under a link', () => {
    expect(isActiveLink('/guides', '/guides/apr-vs-apy-crypto')).toBe(true);
    expect(isActiveLink('/guides', '/guidesx')).toBe(false);
  });

  it('never matches the home link by prefix', () => {
    expect(isActiveLink('/', '/about')).toBe(false);
  });

  it('matches an extra section, such as coin pages for Rates', () => {
    expect(isActiveLink('/', '/rates/btc', '/rates')).toBe(true);
    expect(isActiveLink('/', '/rates', '/rates')).toBe(true);
    expect(isActiveLink('/', '/guides', '/rates')).toBe(false);
  });
});

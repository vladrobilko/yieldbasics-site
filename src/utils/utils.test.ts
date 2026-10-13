import { describe, expect, it } from 'vitest';

import { getColumnsClass, getFormattedDate, trim, truncateAtWord } from '~/utils/utils';

describe('trim', () => {
  it('removes the character from both ends', () => {
    expect(trim('//a/b//', '/')).toBe('a/b');
  });

  it('returns the string unchanged when nothing to trim', () => {
    expect(trim('abc', '/')).toBe('abc');
  });

  it('handles empty input', () => {
    expect(trim('', '/')).toBe('');
    expect(trim(undefined, '/')).toBe('');
  });

  it('returns empty string when every character matches', () => {
    expect(trim('///', '/')).toBe('');
  });
});

describe('truncateAtWord', () => {
  it('keeps text within the limit', () => {
    expect(truncateAtWord('short text', 20)).toBe('short text');
  });

  it('cuts at a word boundary and adds an ellipsis', () => {
    expect(truncateAtWord('the quick brown fox jumps', 15)).toBe('the quick…');
  });

  it('drops trailing punctuation before the ellipsis', () => {
    expect(truncateAtWord('alpha beta, gamma delta', 12)).toBe('alpha beta…');
  });

  it('hard-cuts when there is no space in the second half', () => {
    expect(truncateAtWord('abcdefghijklmnop', 10)).toBe('abcdefghi…');
  });
});

describe('getFormattedDate', () => {
  it('formats a date in UTC using the site language', () => {
    expect(getFormattedDate(new Date('2026-10-13T23:30:00Z'))).toBe('Oct 13, 2026');
  });

  it('returns empty string for a missing date', () => {
    expect(getFormattedDate(undefined as unknown as Date)).toBe('');
  });
});

describe('getColumnsClass', () => {
  it.each([
    [4, 'lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2'],
    [3, 'lg:grid-cols-3 sm:grid-cols-2'],
    [2, 'sm:grid-cols-2'],
  ])('returns grid classes for %i columns', (columns, expected) => {
    expect(getColumnsClass(columns)).toBe(expected);
  });

  it('falls back for other values', () => {
    expect(getColumnsClass(1, 'fallback')).toBe('fallback');
    expect(getColumnsClass(undefined)).toBe('');
  });
});

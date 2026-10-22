import { describe, expect, it } from 'vitest';

import { guideLastmods, postLastmod } from '~/utils/guideDates';

const post = (fields: string) => `---\ntitle: 'A guide'\n${fields}\n---\n\nBody with publishDate: 2020-01-01`;

describe('postLastmod', () => {
  it('uses publishDate', () => {
    expect(postLastmod(post('publishDate: 2026-10-15'))).toBe('2026-10-15T00:00:00.000Z');
  });

  it('prefers updateDate, quoted or not', () => {
    expect(postLastmod(post("publishDate: 2026-10-15\nupdateDate: '2026-11-02'"))).toBe('2026-11-02T00:00:00.000Z');
  });

  it('ignores dates outside the frontmatter and invalid dates', () => {
    expect(postLastmod(post('order: 1'))).toBeUndefined();
    expect(postLastmod(post('publishDate: soon'))).toBeUndefined();
  });

  it('skips drafts', () => {
    expect(postLastmod(post('publishDate: 2026-10-15\ndraft: true'))).toBeUndefined();
  });
});

describe('guideLastmods', () => {
  it('maps each guide and gives /guides the newest date', () => {
    const dates = guideLastmods([
      { slug: 'a', source: post('publishDate: 2026-10-15') },
      { slug: 'b', source: post('publishDate: 2026-10-20') },
      { slug: 'c', source: post('order: 2') },
    ]);
    expect(Object.fromEntries(dates)).toEqual({
      '/guides/a': '2026-10-15T00:00:00.000Z',
      '/guides/b': '2026-10-20T00:00:00.000Z',
      '/guides': '2026-10-20T00:00:00.000Z',
    });
  });
});

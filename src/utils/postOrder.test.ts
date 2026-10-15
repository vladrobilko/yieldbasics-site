import { describe, expect, it } from 'vitest';

import { comparePosts } from '~/utils/postOrder';

const post = (id: string, publishDate: string, order?: number) => ({ id, publishDate: new Date(publishDate), order });

describe('comparePosts', () => {
  it('puts ordered posts first, lowest first, then the rest newest first', () => {
    const posts = [
      post('old', '2026-01-01'),
      post('second', '2026-03-01', 2),
      post('new', '2026-06-01'),
      post('first', '2026-02-01', 1),
    ];
    expect([...posts].sort(comparePosts).map((p) => p.id)).toEqual(['first', 'second', 'new', 'old']);
  });

  it('breaks ties in order by date, newest first', () => {
    const posts = [post('a', '2026-01-01', 1), post('b', '2026-05-01', 1)];
    expect([...posts].sort(comparePosts).map((p) => p.id)).toEqual(['b', 'a']);
  });
});

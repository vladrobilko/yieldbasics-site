import { describe, expect, it } from 'vitest';

import { INDEXNOW_KEY, indexNowBody } from '~/utils/indexNow';

describe('indexNowBody', () => {
  it('builds absolute URLs, the host and the key location', () => {
    expect(indexNowBody('https://yieldbasics.com', ['/', '/rates/usdt'], 'abc')).toEqual({
      host: 'yieldbasics.com',
      key: 'abc',
      keyLocation: 'https://yieldbasics.com/abc.txt',
      urlList: ['https://yieldbasics.com/', 'https://yieldbasics.com/rates/usdt'],
    });
  });

  it('drops duplicate URLs', () => {
    expect(indexNowBody('https://yieldbasics.com', ['/rates/btc', '/rates/btc']).urlList).toHaveLength(1);
  });

  it('uses a key that matches its file in public/', async () => {
    const { readFile } = await import('node:fs/promises');
    expect(await readFile(`public/${INDEXNOW_KEY}.txt`, 'utf8')).toBe(INDEXNOW_KEY);
  });
});

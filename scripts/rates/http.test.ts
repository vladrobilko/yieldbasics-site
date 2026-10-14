import { describe, expect, it } from 'vitest';

import { fetchJsonWithFallback } from './http';
import type { FetchJson } from './types';

/** A fake fetchJson that fails for the hosts listed in `blocked`. */
const fakeFetch =
  (blocked: string[]): FetchJson =>
  async (url) => {
    const host = new URL(url).host;
    if (blocked.includes(host)) throw new Error(`HTTP 403 from ${host}`);
    return { host };
  };

const HOSTS = ['https://api.bybit.com', 'https://api.bytick.com'];

describe('fetchJsonWithFallback', () => {
  it('uses the first host that answers', async () => {
    expect(await fetchJsonWithFallback(fakeFetch([]), HOSTS, '/v5/x')).toEqual({ host: 'api.bybit.com' });
    expect(await fetchJsonWithFallback(fakeFetch(['api.bybit.com']), HOSTS, '/v5/x')).toEqual({
      host: 'api.bytick.com',
    });
  });

  it('reports every error when all hosts fail', async () => {
    await expect(fetchJsonWithFallback(fakeFetch(['api.bybit.com', 'api.bytick.com']), HOSTS, '/v5/x')).rejects.toThrow(
      'HTTP 403 from api.bybit.com; HTTP 403 from api.bytick.com'
    );
  });
});

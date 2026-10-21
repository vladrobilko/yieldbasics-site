import { describe, expect, it } from 'vitest';

import { handle } from './bybit-worker.js';

const WORKER = 'https://bybit-proxy.example.workers.dev';

const fakeFetch = () => {
  const calls: string[] = [];
  const fetchImpl = (async (url: string) => {
    calls.push(url);
    return new Response('{"retCode":0}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  return { calls, fetchImpl };
};

describe('bybit proxy worker', () => {
  it('forwards the earn product request to api.bybit.com', async () => {
    const { calls, fetchImpl } = fakeFetch();
    for (const category of ['FlexibleSaving', 'OnChain']) {
      const response = await handle(new Request(`${WORKER}/v5/earn/product?category=${category}`), fetchImpl);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ retCode: 0 });
      expect(response.headers.get('X-Proxy-Colo')).toBe('unknown');
    }
    expect(calls).toEqual([
      'https://api.bybit.com/v5/earn/product?category=FlexibleSaving',
      'https://api.bybit.com/v5/earn/product?category=OnChain',
    ]);
  });

  it('refuses any other path, method, category or parameter', async () => {
    const { calls, fetchImpl } = fakeFetch();
    const requests = [
      new Request(`${WORKER}/`),
      new Request(`${WORKER}/v5/market/tickers?category=spot`),
      new Request(`${WORKER}/v5/earn/product?category=Other`),
      new Request(`${WORKER}/v5/earn/product`),
      new Request(`${WORKER}/v5/earn/product?category=OnChain&coin=BTC`),
      new Request(`${WORKER}/v5/earn/product?category=OnChain`, { method: 'POST' }),
    ];
    for (const request of requests) {
      expect((await handle(request, fetchImpl)).status, request.url).toBe(403);
    }
    expect(calls).toEqual([]);
  });
});

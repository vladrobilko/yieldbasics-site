import type { FetchJson } from './types';

const USER_AGENT = 'Mozilla/5.0 (compatible; YieldBasicsRatesBot/1.0; +https://yieldbasics.com)';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch() returning parsed JSON, with a timeout and a couple of retries on
 * network errors, 429 (rate limited) and 5xx responses. Other 4xx responses
 * (blocked, bad request) fail straight away: retrying won't fix them.
 */
export const createFetchJson =
  ({ timeoutMs = 20_000, retries = 2 } = {}): FetchJson =>
  async (url, init) => {
    const host = new URL(url).host;
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await wait(2000 * attempt);
      let response: Response;
      try {
        response = await fetch(url, {
          ...init,
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...init?.headers },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        lastError = error;
        continue;
      }
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status} from ${host}`);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${host}`);
      return response.json();
    }
    throw lastError;
  };

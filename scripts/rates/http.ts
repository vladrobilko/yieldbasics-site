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

/**
 * GETs `path` from each base URL in turn and returns the first success, e.g.
 * an exchange's alternate API domain when the main one blocks the runner's
 * region. Throws with every error when all of them fail.
 */
export const fetchJsonWithFallback = async (
  fetchJson: FetchJson,
  baseUrls: readonly string[],
  path: string
): Promise<unknown> => {
  const errors: string[] = [];
  for (const baseUrl of baseUrls) {
    try {
      return await fetchJson(`${baseUrl}${path}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(errors.join('; '));
};

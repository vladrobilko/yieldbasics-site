import type { RateOffer, SourceKind } from '../../src/utils/rates';

/** GETs (or POSTs, via `init`) a URL and returns the parsed JSON body. Throws on HTTP errors. */
export type FetchJson = (url: string, init?: RequestInit) => Promise<unknown>;

export interface Source {
  platformId: string;
  kind: SourceKind;
  /** Fetches every offer for `assets` (canonical symbols from the asset picker). */
  fetch: (fetchJson: FetchJson, assets: readonly string[]) => Promise<RateOffer[]>;
}

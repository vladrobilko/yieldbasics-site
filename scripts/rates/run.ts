/**
 * Daily earn-rate update: `npm run rates`.
 *
 * Fetches every source, keeps offers for assets in the picker, merges the
 * hand-maintained src/data/manual-rates.json and writes src/data/rates.json.
 * A failed source keeps its previous offers (see mergeRates). A Markdown
 * summary of the changes is printed, and also written to the path given with
 * `--summary <file>` (used as the body of the daily PR).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { platforms } from '../../src/data/platforms';
import { assets } from '../../src/data/yields';
import {
  mergeRates,
  offerProblem,
  summarizeChanges,
  type ManualOffer,
  type RatesFile,
  type SourceResult,
} from '../../src/utils/rates';
import { createFetchJson } from './http';
import { aave } from './sources/aave';
import { binance } from './sources/binance';
import { bybit } from './sources/bybit';
import { coinw } from './sources/coinw';
import { gate } from './sources/gate';
import { kucoin } from './sources/kucoin';
import { okx } from './sources/okx';
import type { Source } from './types';

const SOURCES: Source[] = [binance, bybit, okx, gate, kucoin, coinw, aave];

const dataPath = (name: string) => fileURLToPath(new URL(`../../src/data/${name}`, import.meta.url));
const RATES_PATH = dataPath('rates.json');
const MANUAL_PATH = dataPath('manual-rates.json');

const readJson = <T>(path: string): T | null => {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
};

const assetSymbols = assets.map((asset) => asset.symbol);
const platformIds = platforms.map((platform) => platform.id);

const runSource = async (source: Source): Promise<SourceResult> => {
  try {
    const offers = await source.fetch(createFetchJson(), assetSymbols);
    const valid = offers.filter((offer) => {
      const problem = offerProblem(offer, assetSymbols, platformIds);
      if (problem) console.warn(`[${source.platformId}] skipped ${offer.asset} ${offer.product}: ${problem}`);
      return !problem;
    });
    if (valid.length === 0) return { ok: false, error: 'no offers returned' };
    return { ok: true, source: source.kind, offers: valid };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

const main = async () => {
  const previous = readJson<RatesFile>(RATES_PATH);
  // Hand-typed offers get the same sanity checks as fetched ones.
  const manual = (readJson<{ offers: ManualOffer[] }>(MANUAL_PATH)?.offers ?? []).filter((offer) => {
    const problem = offerProblem(offer, assetSymbols, platformIds);
    if (problem) console.warn(`[manual] skipped ${offer.platformId} ${offer.asset} ${offer.product}: ${problem}`);
    return !problem;
  });

  const results = Object.fromEntries(
    await Promise.all(SOURCES.map(async (source) => [source.platformId, await runSource(source)] as const))
  );
  for (const [platformId, result] of Object.entries(results)) {
    console.log(result.ok ? `✓ ${platformId}: ${result.offers.length} offers` : `✗ ${platformId}: ${result.error}`);
  }

  const next = mergeRates({ previous, results, manual, now: new Date() });
  writeFileSync(RATES_PATH, `${JSON.stringify(next, null, 2)}\n`);

  const summary = summarizeChanges(previous, next);
  console.log(`\n${summary}`);
  const summaryFlag = process.argv.indexOf('--summary');
  if (summaryFlag !== -1 && process.argv[summaryFlag + 1]) writeFileSync(process.argv[summaryFlag + 1], `${summary}\n`);

  if (Object.values(results).every((result) => !result.ok)) {
    console.error('Every source failed.');
    process.exitCode = 1;
  }
};

await main();

/**
 * Publishes a manual rates check without fetching the other sources:
 * `npm run rates:manual`. Rebuilds the manual offers in src/data/rates.json
 * from src/data/manual-rates.json and prints what changed. History is left to
 * the next daily run. See .agents/skills/update-manual-rates.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { platforms } from '../../src/data/platforms';
import { assets } from '../../src/data/yields';
import {
  applyManualOffers,
  offerProblem,
  summarizeChanges,
  type ManualOffer,
  type RatesFile,
} from '../../src/utils/rates';

const dataPath = (name: string) => fileURLToPath(new URL(`../../src/data/${name}`, import.meta.url));
const RATES_PATH = dataPath('rates.json');
const MANUAL_PATH = dataPath('manual-rates.json');

const assetSymbols = assets.map((asset) => asset.symbol);
const platformIds = platforms.map((platform) => platform.id);

const previous = JSON.parse(readFileSync(RATES_PATH, 'utf8')) as RatesFile;
const manual = (JSON.parse(readFileSync(MANUAL_PATH, 'utf8')) as { offers: ManualOffer[] }).offers.filter((offer) => {
  const problem = offerProblem(offer, assetSymbols, platformIds);
  if (problem) console.warn(`[manual] skipped ${offer.platformId} ${offer.asset} ${offer.product}: ${problem}`);
  return !problem;
});

const next = applyManualOffers(previous, manual, new Date());
writeFileSync(RATES_PATH, `${JSON.stringify(next, null, 2)}\n`);
console.log(summarizeChanges(previous, next));

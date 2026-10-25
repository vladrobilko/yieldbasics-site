/**
 * Posts the daily rates summary to X: `npm run x:daily -- [--previous <rates.json>]`.
 * With --previous (the rates file before this update), nothing is posted when no
 * rate changed. DRY_RUN=1, or missing X_* secrets, prints the text instead.
 * --text-only prints just the post text (or nothing), for the daily rates PR.
 */
import { readFileSync } from 'node:fs';
import { getPlatform } from '../../src/data/platforms';
import { toRateRow, type RatesFile } from '../../src/utils/rates';
import { createPost, type XCredentials } from '../../src/utils/xApi';
import { dailyPostText } from '../../src/utils/xPost';

const readRows = (path: string) => {
  const file = JSON.parse(readFileSync(path, 'utf8')) as Partial<RatesFile>;
  const now = new Date();
  return (file.offers ?? []).map((offer) => toRateRow(offer, now));
};

const previousIndex = process.argv.indexOf('--previous');
const previousPath = previousIndex > 0 ? process.argv[previousIndex + 1] : undefined;
const textOnly = process.argv.includes('--text-only');

let previousRows = null;
if (previousPath) {
  try {
    previousRows = readRows(previousPath);
  } catch {
    if (!textOnly) console.log(`No previous rates at ${previousPath}; posting without the change check.`);
  }
}

const text = dailyPostText(readRows('src/data/rates.json'), previousRows, new Date(), (id) => getPlatform(id).name);

if (textOnly) {
  if (text) console.log(text);
  process.exit(0);
}

if (!text) {
  console.log('No rate changed since the previous update (or no offers): nothing to post.');
  process.exit(0);
}

const credentials: XCredentials = {
  apiKey: process.env.X_API_KEY ?? '',
  apiSecret: process.env.X_API_SECRET ?? '',
  accessToken: process.env.X_ACCESS_TOKEN ?? '',
  accessSecret: process.env.X_ACCESS_SECRET ?? '',
};
const hasCredentials = Object.values(credentials).every(Boolean);

if (process.env.DRY_RUN || !hasCredentials) {
  console.log(hasCredentials ? 'DRY_RUN: not posting.' : 'No X_* secrets set: not posting.');
  console.log(`--- ${text.length} characters ---\n${text}`);
} else {
  const id = await createPost(text, credentials);
  console.log(`Posted to X: https://x.com/i/web/status/${id}`);
}

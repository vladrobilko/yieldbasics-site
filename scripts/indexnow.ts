/**
 * Tells Bing and other IndexNow engines that the home page, the coin rate
 * pages and the platform pages changed: `npm run indexnow`. DRY_RUN=1 prints the request instead.
 */
import { platforms, platformSlug } from '../src/data/platforms';
import { assets, rateRows } from '../src/data/yields';
import { assetSlug, assetsWithOffers } from '../src/utils/assetPages';
import { INDEXNOW_ENDPOINT, indexNowBody } from '../src/utils/indexNow';
import { platformsWithOffers } from '../src/utils/platformPages';

// Same as `site.site` in src/config.yaml.
const SITE_URL = 'https://yieldbasics.com';

const paths = [
  '/',
  ...assetsWithOffers(assets, rateRows).map((asset) => `/rates/${assetSlug(asset.symbol)}`),
  ...platformsWithOffers(platforms, rateRows).map((platform) => `/platforms/${platformSlug(platform)}`),
];
const body = indexNowBody(SITE_URL, paths);

if (process.env.DRY_RUN) {
  console.log(JSON.stringify(body, null, 2));
} else {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  console.log(`IndexNow: ${response.status} ${response.statusText} for ${body.urlList.length} URLs`);
  if (!response.ok) process.exit(1);
}

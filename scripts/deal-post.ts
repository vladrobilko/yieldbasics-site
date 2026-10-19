/**
 * Prints the X post text for a deal: `npm run deals:post <id>`.
 * With no id, lists the deals that haven't ended.
 */
import { deals } from '../src/data/deals';
import { getPlatform } from '../src/data/platforms';
import { visibleDeals, xPostText } from '../src/utils/deals';

// Same as `site.site` in src/config.yaml.
const SITE_URL = 'https://yieldbasics.com';

const id = process.argv[2];

if (!id) {
  const live = visibleDeals(deals, new Date());
  console.log(live.length > 0 ? live.map((deal) => deal.id).join('\n') : 'No live deals in src/data/deals.json');
} else {
  const deal = deals.find((d) => d.id === id);
  if (!deal) {
    console.error(`No deal with id "${id}" in src/data/deals.json`);
    process.exit(1);
  }
  console.log(xPostText(deal, getPlatform(deal.platformId).name, SITE_URL));
}

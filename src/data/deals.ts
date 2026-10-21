import dealsFile from './deals.json';
import { hasLiveDeals, type Deal } from '~/utils/deals';

/** Every deal in src/data/deals.json, ended ones included (see visibleDeals). */
export const deals = dealsFile.deals as Deal[];

/** Newest `verifiedAt`, for the sitemap; null when there are no deals. */
export const dealsUpdatedAt: string | null =
  deals
    .map((deal) => deal.verifiedAt)
    .sort()
    .at(-1) ?? null;

/** Whether any deal is live at build time. When none is, /deals is left out of the menus, the sitemap and search engines. */
export const dealsLive = hasLiveDeals(deals, new Date());

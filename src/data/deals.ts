import dealsFile from './deals.json';
import type { Deal } from '~/utils/deals';

/** Every deal in src/data/deals.json, ended ones included (see visibleDeals). */
export const deals = dealsFile.deals as Deal[];

/** Newest `verifiedAt`, for the sitemap; null when there are no deals. */
export const dealsUpdatedAt: string | null =
  deals
    .map((deal) => deal.verifiedAt)
    .sort()
    .at(-1) ?? null;

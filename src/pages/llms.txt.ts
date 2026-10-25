import { SITE, METADATA } from 'astrowind:config';
import { getPlatform } from '~/data/platforms';
import { assets, rateRows, ratesUpdatedAt } from '~/data/yields';
import { assetSlug, assetsWithOffers, bestRatesText, summarizeAsset } from '~/utils/assetPages';
import { fetchPosts } from '~/utils/blog';
import { buildLlmsTxt } from '~/utils/llmsTxt';
import { getPermalink } from '~/utils/permalinks';
import { formatRateDate } from '~/utils/rates';
import { siteStats } from '~/utils/yields';

export const prerender = true;

const url = (path: string, type?: string) => new URL(getPermalink(path, type), SITE.site).href;
const platformName = (id: string) => getPlatform(id).name;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const GET = async () => {
  const stats = siteStats(rateRows);
  const updated = formatRateDate(ratesUpdatedAt);
  const posts = await fetchPosts();

  const coinLinks = assetsWithOffers(assets, rateRows).map((asset) => {
    const summary = summarizeAsset(rateRows.filter((row) => row.asset === asset.symbol));
    const best = bestRatesText(asset.symbol, summary, platformName);
    return {
      title: `${asset.name === asset.symbol ? asset.symbol : `${asset.symbol} (${asset.name})`} earn rates`,
      url: url(`/rates/${assetSlug(asset.symbol)}`),
      note: best ? `${capitalize(best)}.` : `${summary.offerCount} offers.`,
    };
  });

  const text = buildLlmsTxt({
    siteName: SITE.name,
    summary: METADATA?.description ?? '',
    details: [
      `Daily savings and staking rates (APR / APY) for ${stats.coins} coins from ${stats.platforms} exchanges, DeFi protocols and wallets: ${stats.offers} offers in total. Last update: ${updated}.`,
      "Rates come from each platform's public API or web pages. A few platforms show rates only to signed-in users; those are checked by hand and marked with the check date. New-user offers are listed separately and ranked by the total reward.",
      '"View offer" buttons are referral links. They never change the ranking, which is always by rate. Educational content, not financial advice.',
    ],
    sections: [
      {
        title: 'Rate pages',
        links: [
          {
            title: 'All crypto earn rates',
            url: url('/'),
            note: 'every offer in one table, filterable by coin and term.',
          },
          ...coinLinks,
        ],
      },
      {
        title: 'Tools',
        links: [
          {
            title: 'APR to APY calculator',
            url: url('/apr-to-apy-calculator'),
            note: 'converts between APR and APY for any compounding frequency.',
          },
        ],
      },
      {
        title: 'Guides',
        links: posts.map((post) => ({
          title: post.title,
          url: url(post.permalink, 'post'),
          note: post.excerpt,
        })),
      },
      {
        title: 'About',
        links: [
          { title: 'About YieldBasics', url: url('/about') },
          { title: 'Contact', url: url('/contact') },
          { title: 'Terms', url: url('/terms') },
          { title: 'Privacy Policy', url: url('/privacy') },
        ],
      },
      {
        title: 'Optional',
        links: [
          { title: 'Guides RSS feed', url: url('rss.xml', 'asset') },
          { title: 'Sitemap', url: url('sitemap-index.xml', 'asset') },
        ],
      },
    ],
  });

  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

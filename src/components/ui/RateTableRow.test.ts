import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import RateTableRow from '~/components/ui/RateTableRow.astro';
import { platforms } from '~/data/platforms';
import type { RateRow } from '~/utils/rates';

const platform = platforms[0];

const row: RateRow & { platform: typeof platform } = {
  id: 'test-usdt-flexible',
  platformId: platform.id,
  platform,
  asset: 'USDT',
  rate: 5,
  type: 'APR',
  product: 'Flexible Savings',
  term: 'Flexible',
  termDays: 0,
  conditionTop: 'No minimum',
  conditionBottom: 'Withdraw anytime',
  promotional: false,
  audience: 'all',
  maxReward: null,
  source: 'api',
  updatedAt: '2026-10-15T06:00:00Z',
  stale: false,
};

describe('RateTableRow', () => {
  it('links the exchange logo and name to the referral URL, outside the tab order', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(RateTableRow, { props: { row } });
    const brandCell = html.match(/<th[^>]*>([\s\S]*?)<\/th>/)?.[1] ?? '';
    const brand = brandCell.match(/<a\s[^>]*>/)?.[0] ?? '';

    expect(brand).toContain(`href="${platform.referralUrl.replaceAll('&', '&amp;')}"`);
    expect(brand).toContain('rel="sponsored nofollow noopener"');
    expect(brand).toContain('target="_blank"');
    expect(brand).toContain('tabindex="-1"');
    expect(brandCell).toContain(platform.name);
  });
});

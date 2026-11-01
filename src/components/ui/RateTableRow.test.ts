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

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(RateTableRow, { props: { row, ...props } });
};
const firstCell = (html: string) => html.match(/<th[^>]*>([\s\S]*?)<\/th>/)?.[1] ?? '';

describe('RateTableRow', () => {
  it('links the platform logo and name to its page on the site', async () => {
    const cell = firstCell(await render());
    const brand = cell.match(/<a\s[^>]*>/)?.[0] ?? '';

    expect(brand).toContain(`href="/platforms/${platform.id}"`);
    expect(brand).not.toContain('sponsored');
    expect(brand).not.toContain('target="_blank"');
    expect(cell).toContain(platform.name);
  });

  it('keeps the referral link on the View offer button', async () => {
    const html = await render();
    const button = html.match(/<a\s[^>]*aria-label="View[^>]*>/)?.[0] ?? '';
    expect(button).toContain(`href="${platform.referralUrl.replaceAll('&', '&amp;')}"`);
    expect(button).toContain('rel="sponsored nofollow noopener"');
  });

  it('shows the coin instead of the platform on a platform page', async () => {
    const cell = firstCell(await render({ lead: 'coin' }));
    expect(cell).toContain('USDT');
    expect(cell).not.toContain(platform.name);
    expect(cell).not.toContain('<a');
  });
});

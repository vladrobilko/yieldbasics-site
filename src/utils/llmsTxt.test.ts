import { describe, expect, it } from 'vitest';

import { buildLlmsTxt } from '~/utils/llmsTxt';

describe('buildLlmsTxt', () => {
  const text = buildLlmsTxt({
    siteName: 'YieldBasics',
    summary: 'Compare crypto earn rates.',
    details: ['Rates are collected daily.'],
    sections: [
      {
        title: 'Rate pages',
        links: [{ title: 'USDT earn rates', url: 'https://yieldbasics.com/rates/usdt', note: 'best 10.00% APR' }],
      },
      { title: 'Empty', links: [] },
      { title: 'Tools', links: [{ title: 'Calculator', url: 'https://yieldbasics.com/apr-to-apy-calculator' }] },
    ],
  });

  it('starts with the title and the summary quote, as llmstxt.org expects', () => {
    expect(text.startsWith('# YieldBasics\n\n> Compare crypto earn rates.\n\nRates are collected daily.\n')).toBe(true);
  });

  it('lists links as Markdown with an optional note', () => {
    expect(text).toContain('## Rate pages\n\n- [USDT earn rates](https://yieldbasics.com/rates/usdt): best 10.00% APR');
    expect(text).toContain('- [Calculator](https://yieldbasics.com/apr-to-apy-calculator)\n');
  });

  it('skips empty sections and ends with one newline', () => {
    expect(text).not.toContain('## Empty');
    expect(text.endsWith('\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
  });
});

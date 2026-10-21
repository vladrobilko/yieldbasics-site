import { dealsLive } from './data/deals';
import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Rates', href: getPermalink('/'), icon: 'tabler:table' },
    ...(dealsLive ? [{ text: 'Deals', href: getPermalink('/deals'), icon: 'tabler:flame' }] : []),
    { text: 'Guides', href: getPermalink('/guides'), icon: 'tabler:book' },
    { text: 'Calculator', href: getPermalink('/apr-to-apy-calculator'), icon: 'tabler:calculator' },
    { text: 'About', href: getPermalink('/about'), icon: 'tabler:info-circle' },
    { text: 'Contact', href: getPermalink('/contact'), icon: 'tabler:mail' },
  ],
  actions: [],
};

export const footerData = {
  links: [
    {
      title: 'Rates',
      links: [
        { text: 'All rates', href: getPermalink('/') },
        { text: 'USDT rates', href: getPermalink('/rates/usdt') },
        { text: 'USDC rates', href: getPermalink('/rates/usdc') },
        { text: 'BTC rates', href: getPermalink('/rates/btc') },
        { text: 'ETH rates', href: getPermalink('/rates/eth') },
        ...(dealsLive ? [{ text: 'Crypto deals', href: getPermalink('/deals') }] : []),
      ],
    },
    {
      title: 'Learn',
      links: [
        { text: 'Guides', href: getPermalink('/guides') },
        { text: 'APR vs APY', href: getPermalink('/guides/apr-vs-apy-crypto') },
        { text: 'Is crypto earn safe?', href: getPermalink('/guides/is-crypto-earn-safe') },
        { text: 'APR to APY calculator', href: getPermalink('/apr-to-apy-calculator') },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [{ ariaLabel: 'YieldBasics on X', icon: 'tabler:brand-x', href: 'https://x.com/Yield_Basics' }],
  footNote: `
    © ${new Date().getFullYear()} YieldBasics · Educational content, not financial advice. Some links are referral links: we may earn a commission, which never changes the ranking.
  `,
};

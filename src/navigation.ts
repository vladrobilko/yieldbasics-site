import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Home', href: getPermalink('/') },
    { text: 'Blog', href: getBlogPermalink() },
    { text: 'About', href: getPermalink('/about') },
    { text: 'Contact', href: getPermalink('/contact') },
  ],
  actions: [],
};

export const footerData = {
  links: [
    {
      title: 'YieldBasics',
      links: [
        { text: 'Home', href: getPermalink('/') },
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [{ ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') }],
  footNote: `
    © ${new Date().getFullYear()} YieldBasics · Educational content, not financial advice.
  `,
};

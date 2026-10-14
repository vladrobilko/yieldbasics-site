import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Rates', href: getPermalink('/'), icon: 'tabler:table' },
    { text: 'Guides', href: getPermalink('/guides'), icon: 'tabler:book', badge: 'soon' },
    { text: 'About', href: getPermalink('/about'), icon: 'tabler:info-circle' },
    { text: 'Contact', href: getPermalink('/contact'), icon: 'tabler:mail' },
  ],
  actions: [],
};

export const footerData = {
  links: [
    {
      title: 'YieldBasics',
      links: [
        { text: 'Home', href: getPermalink('/') },
        { text: 'Guides', href: getPermalink('/guides') },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [],
  footNote: `
    © ${new Date().getFullYear()} YieldBasics · Educational content, not financial advice.
  `,
};

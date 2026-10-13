import { describe, expect, it } from 'vitest';

import buildConfig from './configBuilder';

describe('configBuilder', () => {
  it('fills defaults when config is empty', () => {
    const config = buildConfig({});

    expect(config.SITE).toMatchObject({ name: 'Website', base: '/', trailingSlash: false });
    expect(config.I18N).toMatchObject({ language: 'en', textDirection: 'ltr' });
    expect(config.METADATA.title).toEqual({ default: 'Website', template: '%s' });
    expect(config.APP_BLOG.isEnabled).toBe(false);
    expect(config.UI).toEqual({ theme: 'system' });
  });

  it('merges user values over defaults without dropping nested defaults', () => {
    const config = buildConfig({
      site: { name: 'YieldBasics', site: 'https://yieldbasics.com' },
      apps: { blog: { isEnabled: true, list: { pathname: 'articles' } } as never },
    });

    expect(config.SITE.name).toBe('YieldBasics');
    expect(config.METADATA.title?.default).toBe('YieldBasics');
    expect(config.APP_BLOG.isEnabled).toBe(true);
    expect(config.APP_BLOG.list.pathname).toBe('articles');
    expect(config.APP_BLOG.list.isEnabled).toBe(true);
    expect(config.APP_BLOG.category.pathname).toBe('category');
  });

  it('does not mutate the input config', () => {
    const input = { site: { name: 'A' } };
    buildConfig(input);
    expect(input).toEqual({ site: { name: 'A' } });
  });
});

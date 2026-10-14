# YieldBasics Agent Instructions

## Project Overview

**YieldBasics** ([yieldbasics.com](https://yieldbasics.com)) compares crypto earn rates (APR / APY) across exchanges, DeFi and wallets, refreshed daily, with referral links on every offer. Plain-language guides are planned (`/guides` is a "coming soon" page; the blog is switched off in `config.yaml` until there is content). English only. The brand is "YieldBasics" — never publish a personal name. Content is educational, not financial advice.

It is a fully static site built on the open-source **AstroWind** template (Astro v7 + Tailwind CSS v4) hosted on **GitHub Pages** at yieldbasics.com: `.github/workflows/deploy.yaml` builds and publishes every push to `master` (`public/CNAME` holds the domain). Pages are emitted as `about.html` (`build.format: 'file'`) so `/about` is served without a redirect; `getCanonical` strips the `.html`.

**Stack:** Astro v7 | Tailwind CSS v4 | TypeScript 5.9 | MDX | Sharp | Vitest

## Workflow Rules (mandatory for every agent)

1. **Pull requests only.** Never commit or push directly to `master` (the default branch). Every change goes on its own branch and is merged through a pull request (`gh pr create`).
2. **Branch naming:** `<bugfix|feature>/<agent>/<kebab-case-summary>`, where `<agent>` is who implements it (`claude`, `codex`, `human`, …).
   - `feature/claude/change-design-for-home-page`
   - `bugfix/claude/fix-mobile-menu-overlap`
3. **Logic is covered by tests.** Any logic (utils, data transforms, calculators, config handling) gets Vitest unit tests in the same PR, next to the code as `*.test.ts`. Pure markup/copy changes don't need tests.
4. **Run everything locally before pushing:** `npm test`, `npm run check`, `npm run build` must all pass. The `.githooks/pre-push` hook runs them automatically; never bypass it with `--no-verify`.
5. **The user sees the UI before every push.** Start `npm run dev` (or `npm run build && npm run preview`), give the user the local URL and the list of pages affected, and push only after the user explicitly approves.
6. **The repo is public — no sensitive data.** Never commit `.env*` files (only a value-free `.env.example`), API keys, tokens, passwords, private keys or seed phrases, wallet/account details, personal information, or local machine paths. Secrets go in GitHub Actions secrets. Review `git diff --staged` before every commit.
7. Keep commits focused with a short imperative message.

## Contact Form

`/contact` posts to [Web3Forms](https://web3forms.com), which emails each message to the site owner with the subject "[YieldBasics] Contact: <topic>". The access key (`WEB3FORMS_ACCESS_KEY` in `src/utils/contact.ts`) is public by design and safe to commit; never put the destination email address in the repo.

## Skills

Before implementing a project-specific task (disabling the blog, Open Graph images, header customisation, contact form…), check `.agents/skills/` for an existing skill and follow it.

## Quick Reference

| Command              | Purpose                             |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start dev server at localhost:4321  |
| `npm run build`      | Production build to `./dist/`       |
| `npm run preview`    | Preview production build locally    |
| `npm test`           | Run Vitest unit tests once          |
| `npm run test:watch` | Run Vitest in watch mode            |
| `npm run check`      | Run astro check + ESLint + Prettier |
| `npm run fix`        | Auto-fix ESLint + Prettier issues   |
| `npm run rates`      | Fetch earn rates → `rates.json`     |

`npm install` also sets `git config core.hooksPath .githooks`, which enables the pre-push hook.

**Node.js requirement:** >= 22.22.3

## Architecture

### Directory Structure

```
src/
  assets/styles/tailwind.css   # Tailwind v4 config (themes, utilities, plugins)
  components/
    common/        # Shared: Image, Metadata, Analytics, ToggleTheme
    ui/            # Primitives: Button, Form, Headline, Timeline, WidgetWrapper
    widgets/       # Page sections: Hero, Features, Bento, Pricing, Comparison, FAQs, Team, Gallery…
    blog/          # Blog: SinglePost, List, Pagination, Tags
    CustomStyles.astro  # CSS variables for colors and fonts
  content.config.ts    # Content Collections schema (Astro 5+ location)
  data/post/           # Blog posts (.md, .mdx)
  layouts/             # Layout.astro, PageLayout.astro, MarkdownLayout.astro
  pages/               # File-based routing
  utils/               # blog.ts, images.ts, permalinks.ts, frontmatter.ts
  config.yaml          # Site configuration (loaded as virtual module)
  navigation.ts        # Navigation structure
  types.d.ts           # TypeScript type definitions
vendor/integration/    # Custom Astro integration for config loading
```

### Testing

Unit tests use **Vitest** (`vitest.config.ts` wraps the Astro config via `getViteConfig`, so `~/` and `astrowind:config` work in tests). Put tests next to the code as `*.test.ts` under `src/` or `vendor/`.

### Path Aliases

Use `~/` to import from `src/`:

```typescript
import Image from '~/components/common/Image.astro';
import { SITE } from 'astrowind:config';
```

### Configuration System

Site config lives in `src/config.yaml` and is loaded as a Vite virtual module `astrowind:config` by the custom integration in `vendor/integration/`. Exports: `SITE`, `I18N`, `METADATA`, `APP_BLOG`, `UI`, `ANALYTICS`.

## Earn Rates

The home page rates table is built from `src/data/rates.json`, which `npm run rates` (`scripts/rates/run.ts`) regenerates; never edit it by hand.

- `.github/workflows/update-rates.yaml` runs `npm run rates` daily at 06:00 UTC (or on demand: `gh workflow run update-rates.yaml`) and opens or updates one PR, `feature/bot/daily-rates-update`, with the new `rates.json` and a summary of changes and failed sources. Merging it publishes the rates.

- Platforms (name, avatar, referral link) live in `src/data/platforms.json`. Every "View offer" button uses the platform's `referralUrl`.
- Each platform with an automatic source has a parser in `scripts/rates/sources/<id>.ts`, tested against trimmed real responses in `scripts/rates/sources/fixtures/`.
- Platforms without a source (currently WEEX and Walt, whose rates are only shown to signed-in users) go in `src/data/manual-rates.json`: one entry per offer with the `RateOffer` fields plus `verifiedAt` (the date the rate was checked on the platform). They show a "Checked <date>" hint and are dropped 30 days after `verifiedAt`. Never automate a signed-in session to collect them.
- Offers only for new accounts or first deposits are kept with `audience: 'new-user'` and a `maxAmount` cap, for USDT/USDC only. They appear only in the "New users" tab, ranked by estimated max reward.
- If a source fails, its previous offers are kept, so a broken parser never empties the table. Rates older than 3 days show a "Checked <date>" hint.
- Shared types and helpers are in `src/utils/rates.ts`.

## Tailwind CSS v4

Configuration is CSS-first in `src/assets/styles/tailwind.css`:

- **Theme tokens:** `@theme { --color-primary: var(--aw-color-primary); ... }`
- **Custom utilities:** `@utility bg-page { ... }`
- **Dark mode:** Class-based via `@variant dark (&:where(.dark, .dark *))`
- **Plugins:** `@plugin "@tailwindcss/typography"`
- **Custom variant:** `@custom-variant intersect (&:not([no-intersect]))`

CSS variables for colors/fonts are defined in `src/components/CustomStyles.astro` with light/dark theme variants.

The Vite plugin `@tailwindcss/vite` is configured in `astro.config.ts` (not as an Astro integration).

### Class Merging

Components use `twMerge` from `tailwind-merge` v3 for conditional class composition.

## Content Collections

Defined in `src/content.config.ts` using Astro's Content Layer API with `glob()` loader. Posts are in `src/data/post/` as `.md` or `.mdx` files.

Post frontmatter: `title` (required), `publishDate`, `updateDate`, `draft`, `excerpt`, `image`, `category`, `tags`, `author`, `metadata`.

## Component Patterns

- Props extend interfaces from `~/types`
- Use `class:list` for conditional classes
- Use `twMerge()` when accepting className overrides
- Use named slots for layout composition
- Widget components accept standardized props (see `~/types`)

## Image Handling

`src/components/common/Image.astro` supports:

- Local images via `astro:assets` (optimized by Sharp)
- Remote images via Unpic CDN
- Allowed domains (for providers Unpic can't detect, processed by Sharp): `cdn.pixabay.com`

Hero images use `loading="eager"` and `fetchpriority="high"`.

## Fonts

Fonts are handled by Astro's native **Fonts API**, configured in `astro.config.ts` under the `fonts` key (provider, family, `cssVariable`) and injected via the `<Font />` component in `src/layouts/Layout.astro`. Astro self-hosts, subsets, preloads, and generates metric-adjusted fallbacks. To change the typeface, edit the `fonts` entry and point `--aw-font-*` in `CustomStyles.astro` at the new `cssVariable`.

## Third-party Scripts (Partytown)

`@astrojs/partytown` is wired as an **opt-in** in `astro.config.ts`, gated behind `const hasExternalScripts = false`. Set it to `true` to offload third-party scripts (e.g. Google Analytics via `analytics.vendors.googleAnalytics.partytown`) to a web worker. It is disabled by default so the base template ships no external scripts.

## Content Security Policy

Astro's native CSP is intentionally **not** enabled in this version: it is incompatible with `<ClientRouter />` view transitions (shipped on by default) and would break the arbitrary third-party scripts a template user typically adds. CSP is deferred to AstroWind v2, where the component model (and optional SSR) make it clean and opt-in.

## Verification Checklist

After changes, always verify:

1. `npm test` passes (Vitest)
2. `npm run build` succeeds
3. `npm run check` passes (astro check + ESLint + Prettier)
4. The user has reviewed the UI locally: homepage (rates table), guides, about, contact, dark mode, mobile menu, plus every page you changed
5. Structured data describes the site it is on: the `WebSite` / `Organization` block in `src/pages/index.astro` is built only from `config.yaml`; anything you add there must be true for your site

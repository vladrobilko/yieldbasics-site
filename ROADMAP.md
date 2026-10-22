# Roadmap

Planned work that isn't done yet, in priority order. Remove an item once its PR is merged. The [growth strategy](#growth-strategy) below explains why the work is in this order.

1. [AI search visibility](#ai-search-visibility): ChatGPT, Claude, Perplexity and Google AI answers.
2. [Daily posts on X](#daily-posts-on-x): automatic, after the daily rates PR is merged.
3. [Logo and brand](#logo-and-brand)
4. [Manual rates routine](#manual-rates-routine): WEEX and Walt from screenshots.
5. [More evergreen guides](#more-evergreen-guides), starting with inflation and real yield.
6. [Community answers](#community-answers): Reddit, Quora, X replies (owner posts).
7. [Beginner help on the rates table](#beginner-help-on-the-rates-table)
8. [Trust lines on the About page](#trust-lines-on-the-about-page)
9. [Countries and platform pages](#countries-and-platform-pages)
10. [Table filters and platform type switch](#table-filters-and-platform-type-switch)
11. [Growth chart on the calculator](#growth-chart-on-the-calculator)
12. [Top promo bar](#top-promo-bar)
13. [Where to buy pages](#where-to-buy-pages)
14. [Market strip](#market-strip): live prices, Fear & Greed, offer count.
15. [Rate history](#rate-history)
16. [Email newsletter](#email-newsletter)
17. [Fees and exchange comparisons](#fees-and-exchange-comparisons)
18. [Country pages](#country-pages)
19. [Full SEO audit and backlinks](#full-seo-audit-and-backlinks)
20. [Affiliate programs](#affiliate-programs)
21. [Traditional yields](#traditional-yields): US Treasuries, "stablecoins vs T-bills".
22. [Google Analytics, consent banner and ads](#google-analytics-consent-banner-and-ads)
23. [Add more platforms](#add-more-platforms): waiting for the owner to register and send referral links.
24. [Watch the daily schedule](#watch-the-daily-schedule)
25. [Sponsored slots and newsletter sponsors](#sponsored-slots-and-newsletter-sponsors)
26. [Russian version of the site (later)](#russian-version-of-the-site-later): after the English site has steady traffic.

## Growth strategy

**Goal:** a lot of visitors and, over the long run, $1M in revenue.

**The math.** Revenue = visitors × click rate × signup rate × value per signup. As an illustration only: 3% click, 10% sign up, $30 per signup. That makes each visitor worth about $0.09, so $1M would take about 11M visits. Once analytics are on, replace these guesses with real numbers every month. Three ways to need fewer visits:

1. **Attract traders, not only savers.** Referral commissions are a share of the trading fees referred users pay, and savers pay almost none. "Where to buy", fees and exchange comparison pages bring people who trade.
2. **Move from referral to affiliate programs.** Exchange affiliate programs pay a much higher share than plain referral links, but they want proof of an audience (traffic, X followers).
3. **Add income that doesn't depend on signups:** a promo bar, ad networks, hardware-wallet affiliates, sponsored slots and newsletter sponsors.

**Ways to earn, in order:** exchange referrals (now) → own promo in a top bar → hardware-wallet affiliates and exchange affiliate programs → crypto ad networks (A-Ads has no traffic minimum; Coinzilla/Bitmedia later) → sponsored "Featured" slot, always labeled and separate from the ranking → newsletter sponsors → broker/bond affiliates for the traditional-yields section. Sponsorship never changes the ranking, as the Terms promise.

**Traffic.** Search is the main engine. Build page types from data, so one template makes many pages: coin pages (exist), platform pages, where-to-buy pages, country pages, exchange comparisons, rate history, calculators and traditional-yield pages. Each page must carry its own data, not a swapped name; Google penalizes thin copy-paste pages. Guides stay evergreen and link to the live pages. X, Reddit/Quora and a newsletter bring the first visitors while search grows.

**Monthly check:**

| When     | Target                                                         |
| -------- | -------------------------------------------------------------- |
| Month 1  | Indexed by Google, ~1k visits                                  |
| Month 3  | ~10k visits/month; apply to affiliate programs                 |
| Month 6  | ~50k visits/month, 1k+ email subscribers                       |
| Month 12 | ~250k visits/month; re-check the $1M math against real numbers |

**Owner tasks outside the repo:** a separate brand Gmail (not a work account) that owns Search Console, analytics, the X developer app, ad networks and affiliate accounts (Search Console and Cloudflare Web Analytics are set up); registering on new platforms. Bing Webmaster Tools is part of [AI search visibility](#ai-search-visibility).

## AI search visibility

ChatGPT, Claude, Perplexity and Google AI answers search the web live and cite the pages they read. Nobody can pay to be included. What we can do is let their crawlers in, get indexed, and write pages that are easy to quote. A daily-updated, dated rate page is the kind of source they like to cite. This doesn't wait for Google: ChatGPT search relies mostly on Bing's index, and Claude and Perplexity run their own crawlers.

Done (2026-10-22): Cloudflare only serves DNS (grey cloud), so its bot blocking does not apply; robots.txt names the AI crawlers; coin pages have an answer line and `dateModified`; the deploy workflow sends an IndexNow ping when the rates change. If the Cloudflare proxy (orange cloud) is ever turned on, check AI Crawl Control and Bot Fight Mode first.

1. **Bing (owner):** add the site to Bing Webmaster Tools and submit `https://yieldbasics.com/sitemap-index.xml`.
2. **`/llms.txt` (optional):** generated at build time from data: what the site is, plus links to the rate pages, calculator and guides. Cheap, but no major AI company has said it uses this file.
3. **Mentions:** AI answers cite Reddit and Quora a lot, so [Community answers](#community-answers) also helps here.
4. **Measure (after 4–6 weeks):** track visits from chatgpt.com, perplexity.ai, claude.ai and copilot in Cloudflare Web Analytics. Once a month the owner asks the same 5 questions (for example "best USDT savings rate") in ChatGPT, Claude and Perplexity and notes whether YieldBasics is cited.

## Daily posts on X

The X API is pay-per-use: about $0.015 per post without a link and about $0.20 with one (2026 prices; check docs.x.com). One text post a day costs about $0.50/month. The link lives in the X bio.

1. `scripts/social/dailyPost.ts` builds the post from `rates.json` with a few rotating templates (top USDT/USDC flexible rate, BTC/ETH, offer count). It returns nothing when the rates didn't change.
2. `.github/workflows/post-to-x.yaml` runs when the daily rates PR is merged into `master` and posts through the X API (OAuth 1.0a user context).
3. Secrets: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`. The owner creates the app on developer.x.com with the brand account. The keys are never committed.
4. Tests: at most 280 characters, no link, numbers match the input, and no post when nothing changed. `DRY_RUN=1` prints the text instead of posting; use it for the first run on a branch.
5. Later: a weekly "biggest moves" post, and a post for each new guide (from `rss.xml`).
6. New deals: the same workflow posts each new entry in `src/data/deals.json` once its PR is merged, using the text from `npm run deals:post <id>` (today the owner pastes it by hand).

## Logo and brand

Before the X account grows, use one logo mark everywhere: header (`src/assets/images/logo.svg`), favicons (`public/icon-*.png`), the OG image and the X avatar. Keep the current green unless the owner picks otherwise. Show 2–3 options locally before choosing.

## Manual rates routine

WEEX and Walt show rates only to signed-in users, so they stay manual. Never automate a signed-in session.

- The owner saves screenshots of the earn screens to a local folder outside the repo (one folder per date, a subfolder per platform), every 2–3 days. Manual rates are dropped 30 days after `verifiedAt`; the last check was 2026-10-21, so the next deadline is 2026-11-20.
- Re-date only what the screenshots show. Fixed-term rates and tiers need their own screenshots; skip coins that aren't in `src/data/yields.ts`.
- An agent reads them, updates `src/data/manual-rates.json` (rates and `verifiedAt`) and opens a PR.
- Write this down as a skill in `.agents/skills/manual-rates/` so any agent follows the same steps.

## Community answers

Answer real questions on Reddit (r/CryptoCurrency, r/stablecoins, r/personalfinance), Quora and X, linking to a rate page or the calculator only when it answers the question. The owner posts by hand, about 20 minutes a day; agents can draft answers. Automating posts breaks these sites' rules.

## Countries and platform pages

- Add a `countries` block to each platform in `src/data/platforms.json`: the restricted countries, a link to the platform's terms, and the date it was checked. Tested helpers in `src/data/platforms.ts`.
- New pages `/platforms/<id>`: every offer on that platform (reuse `RateTableRow.astro`), the countries it serves, its earn product types, the referral bonus and a short evergreen overview (regulation, proof of reserves). Title, description and FAQ come from data, as in `src/utils/assetPages.ts`. Link them from the table rows and the footer.
- This data is also needed for the country pages, the "available in my country" filter and the Russian version.

## Table filters and platform type switch

The table already filters by coin and term and sorts by rate. Add:

- a type switch: All · Exchanges · DeFi · Wallets (from `kind` in `platforms.json`)
- a platform picker and "available in my country" (from the countries data)
- a minimum lock period filter for fixed terms

Put the filter logic in `src/utils/yields.ts` with tests.

## Growth chart on the calculator

On `/apr-to-apy-calculator`, under the result, add a chart of the balance over 1–10 years: no compounding vs the chosen compounding. Use inline SVG, no chart library, working in both themes. Put the series maths in `src/utils/compounding.ts` with tests. Later reuse it on the coin pages.

## Top promo bar

A thin bar above the header, like CoinGecko's. Start with our own promo (the best-paying referral bonus), labeled "Ad", closable (remember the choice in `localStorage`), with no layout shift. Ad networks use the same slot later.

## Where to buy pages

Start with keyword research using Google Trends, Keyword Planner and "People also ask", plus Search Console once it has data. Then build `/buy/<coin>` pages for the listed coins: exchanges that sell the coin, payment methods, trading fees (once the fees data exists) and countries. These pages bring buyers and traders, who earn the most commission.

## Market strip

A small strip under the header with BTC, ETH and a few top coin prices, the Crypto Fear & Greed Index and the offer count.

- Prices load in the visitor's browser from CoinGecko's free public API, with "Prices by CoinGecko" shown.
- Fear & Greed comes from `api.alternative.me/fng/`. Its terms require its name shown right next to the number.
- If a request fails, the strip hides that item. Add both services to the privacy page.

## Rate history

Each daily run also saves a compact snapshot of the best rate per coin and product type (e.g. `src/data/history/<yyyy-mm>.json`). Coin pages show a 90-day chart. Nobody else publishes this history, so other sites have a reason to link here; it also powers the monthly report. Test the snapshot and aggregation logic.

## Email newsletter

A weekly rates digest generated from `rates.json` and the history data, through a free tier (Buttondown or Beehiiv). Add a signup form on the home page and the coin pages, and update the privacy page.

## Fees and exchange comparisons

- `src/data/fees.json`: spot maker/taker fees and withdrawal fees for the main coins, each with a source link and checked date. Check them by hand monthly; fees change rarely.
- A fees table, fees on the platform pages, and `/compare/<a>-vs-<b>` pages for the main pairs: fees, countries, earn products, safety. Rates come from the live data, so these pages don't go stale.

## Country pages

`/countries/<country>`: platforms open in that country, with their best offers. Only for countries where the data makes the page useful. Built from the countries data.

## Full SEO audit and backlinks

Once Search Console has 3–4 weeks of data: fix indexing errors, Core Web Vitals, internal links and pages with low click rates. Then start outreach: a monthly "State of crypto earn rates" report from the history data, pitched to crypto news sites and newsletters and posted on Reddit.

## Affiliate programs

When traffic reaches about 10k visits a month and the X account is active, apply to the exchanges' affiliate programs (Binance, OKX, Bybit, KuCoin and others) and to hardware-wallet affiliates (Ledger, Trezor), and swap the links in `platforms.json`. Check that each program accepts the owner's country first.

## Traditional yields

- A `/rates/us-treasury` page from free official US Treasury data, refreshed by the same daily workflow.
- A "Stablecoin yield vs T-bills" page and calculator.
- Guides on T-bills, bonds, money-market funds and dividends.
- Dividend stock data needs paid APIs, so it waits until the site earns money.

## Google Analytics, consent banner and ads

When the first ad network is added: GA4 (the existing `analytics.vendors.googleAnalytics.id` and `Analytics.astro`) with click events on "View offer", plus a cookie consent banner for EU/UK visitors, plus the ad network itself. Update the privacy page and the terms.

## Sponsored slots and newsletter sponsors

A clearly labeled "Featured" slot sold to platforms, kept separate from the ranking, which stays by rate. Newsletter sponsors once the list has about 2k subscribers.

## Beginner help on the rates table

Visitors new to earn products land on the home table without context.

- Add a short "How to read this table" note near the home table (`src/pages/index.astro`) and on `/rates/<coin>` pages. It covers rate vs. type (APR/APY), flexible vs. fixed term, tiered conditions and the "Checked <date>" hint.
- Move the "New to earning?" box (now below the table in `src/pages/index.astro`) above it, with links to the guides (`/guides`, APR vs APY, the risks guide).
- UI change: review locally before pushing.

## Trust lines on the About page

`src/pages/about.astro` should say plainly:

- that the site is independent, and how referral links work: they never change the ranking, which is by rate
- how platforms are picked, and how rates are collected (daily, from public APIs and pages; manual for WEEX and Walt)

Keep it brand-only, with no personal names.

## More evergreen guides

New posts in `src/data/post/`, in the same style as the existing ones: no rate snapshots or tables, and they link to the `/rates/<coin>` pages instead. Planned:

- USD inflation and real yield: what inflation does to cash, rate minus inflation, stablecoin earn vs savings vs T-bills, and the risks (first; links to the calculator)
- Flexible vs fixed-term earn
- CeFi vs DeFi earn (exchanges vs Aave-style protocols)
- How tiered rates work (why "up to X%" applies only to the first amount)
- How we collect rates (sources, daily updates, stale and manual rates)

## Watch the daily schedule

The daily rates workflow moved to `17 5 * * *` on 2026-10-16, because runs scheduled on the hour started about 4 hours late. It still started late: the runs from 2026-10-17 to 2026-10-21 began between 09:19 and 10:43 UTC (`gh run list --workflow update-rates.yaml`). On 2026-10-21 the owner asked for the rates PR to be ready before 05:00 UTC, so the schedule moved to `17 23 * * *`. Check that the next runs finish before 05:00 UTC; if they don't, move it earlier.

## Add more platforms

**Status:** waiting for the site owner to register and send referral links. Research from 2026-10-17. Country lists come from third-party trackers, so confirm each platform's own terms and KYC when registering.

**For each platform, once its referral link arrives:**

1. Add it to `src/data/platforms.json` (name, kind, website, `referralUrl`, logo).
2. Find a rates source: an official public API first, then a public web JSON endpoint, then a headless browser (MEXC used one through `playwright-core`; both were removed with MEXC on 2026-10-21, so restore them from git history if needed). If none works, use `src/data/manual-rates.json`.
3. Add a parser in `scripts/rates/sources/<id>.ts` with a trimmed real response in `fixtures/` and tests. One PR per platform.

### To-do: register

Exchanges (CEX). None of these could fetch rates from a plain page request on 2026-10-17, so each needs its earn endpoint found.

- [ ] **Phemex**: flexible savings. Open to the EU; not to the US, UK or Australia. Widest reach of this group.
- [ ] **CoinEx**: earn products, many coins. Not for the US, Canada, EEA, UK or Switzerland.
- [ ] **BingX**: Wealth (flexible, 30 and 90 days). Not for the EEA, US or Canada.
- [ ] **XT.com**: earn products, affiliate program. Not for the EU/EEA, US or Canada.
- [ ] **HTX**: large earn range. Not for the EU, UK or US. The EU put HTX under transaction restrictions; decide whether to list it.

DeFi (no KYC, open in every country, wallet only). Rates are in the DefiLlama yields API that the Aave source already uses.

- [ ] **Kamino** (Solana lending): referrers earn a share of protocol fees through a referral link. Set it up from a wallet.
- [ ] **Hyperliquid** (HLP vault): referral code pays 10% of referred users' trading fees and needs $10,000 of own trading volume first. The HLP rate comes from the public `api.hyperliquid.xyz/info` API (`vaultDetails`).
- [ ] **Aster** (USDF and Earn): referral program of about 10% of fees. Confirm the terms and a rates source on the official site.

DeFi without a referral program. Add for completeness, all from DefiLlama in one PR: Jupiter Lend, Morpho, Compound v3, Spark and Sky (sUSDS), Ethena (sUSDe), Fluid, Maple, Lido (stETH).

Wallets.

- [ ] **Tangem**: Yield Mode supplies USDT/USDC to Aave. Its referral program only pays per hardware wallet sold (5 USDT), so it is a weak fit.

**Not suitable for the owner:** LBank, Toobit and Bitget (owner can't register). MEXC was removed on 2026-10-21 after it left Russia and Belarus. YouHodler and Nexo look unlikely; check before spending time on them.

## Russian version of the site (later)

Start only once the English site has steady traffic. The Russian-speaking audience (Russia, Belarus, Kazakhstan, Uzbekistan, the Caucasus, emigrants) is large and active in crypto, and Russian-language search has few comparisons of daily-updated earn rates. Income would come from the platforms already listed, many of which are popular with this audience.

**Plan, in steps:**

1. Add Russian versions of the home page and the `/rates/<coin>` pages only, under `/ru/`, with `hreflang` links between languages. The page text, FAQ answers (`src/utils/assetPages.ts`) and the table UI need translating; the rates data is shared.
2. Mark offers that aren't available to people in Russia or Belarus (for example, platforms that block those countries). This needs a per-platform list of restricted countries in `src/data/platforms.json`, kept up to date.
3. Measure traffic for a few months. Only then translate guides and other pages.

**Keep out:** Belarusian and Russian venues have no earn products (BYNEX, Whitebird, the Moscow and SPB stock exchanges), and some Russian exchanges are sanctioned or high-risk (Grinex, Rapira, ABCEX). Don't list them.

**Decision needed from the owner first:** check the advertising rules for crypto services in Russia and Belarus (Belarus blocked several exchange sites over advertising in December 2025), and whether the Russian pages could get the site blocked there.

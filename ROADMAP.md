# Roadmap

Planned work that isn't done yet, in priority order. Remove an item once its PR is merged. The [growth strategy](#growth-strategy) below explains why the work is in this order.

1. [Platform pages](#platform-pages): `/platforms/<id>` from the data we already have.
2. [More evergreen guides](#more-evergreen-guides), about one a week alongside the rest; next: flexible vs fixed-term earn.
3. [Email signup and weekly digest](#email-signup-and-weekly-digest): start collecting subscribers early.
4. [First Search Console check](#first-search-console-check): around mid-November 2026.
5. [Growth chart on the calculator](#growth-chart-on-the-calculator)
6. [Table filters and platform type switch](#table-filters-and-platform-type-switch): the type switch first.
7. [Daily posts on X](#daily-posts-on-x): the post text is in each daily rates PR; next: optional image, then automatic posting and the inbox tool once the owner has X keys.
8. [Rate history chart](#rate-history-chart): the daily data is already saved; the chart once there are about 30 days.
9. [Countries data](#countries-data)
10. [Where to buy pages](#where-to-buy-pages)
11. [Fees and exchange comparisons](#fees-and-exchange-comparisons)
12. [Country pages](#country-pages)
13. [Full SEO audit and backlinks](#full-seo-audit-and-backlinks)
14. [Affiliate programs](#affiliate-programs)
15. [Market strip](#market-strip): live prices, Fear & Greed, offer count.
16. [Traditional yields](#traditional-yields): US Treasuries, "stablecoins vs T-bills".
17. [Google Analytics, consent banner and ads](#google-analytics-consent-banner-and-ads)
18. [Add more platforms](#add-more-platforms): waiting for the owner to register and send referral links.
19. [Sponsored slots and newsletter sponsors](#sponsored-slots-and-newsletter-sponsors)
20. [Russian version of the site (later)](#russian-version-of-the-site-later): after the English site has steady traffic.

**Ongoing, not in the queue:** [AI search visibility](#ai-search-visibility) (monthly check from December 2026) and [Community answers](#community-answers) (owner posts by hand).

Order reviewed 2026-10-30: rate history moved first and was built (the daily data can't be recovered later), platform pages split from the slower countries data, the email signup moved up so subscribers start adding up, and the market strip moved down (little search value).

## Growth strategy

**Goal:** a lot of visitors and, over the long run, $1M in revenue.

**The math.** Revenue = visitors × click rate × signup rate × value per signup. As an illustration only: 3% click, 10% sign up, $30 per signup. That makes each visitor worth about $0.09, so $1M would take about 11M visits. Once analytics are on, replace these guesses with real numbers every month. Three ways to need fewer visits:

1. **Attract traders, not only savers.** Referral commissions are a share of the trading fees referred users pay, and savers pay almost none. "Where to buy", fees and exchange comparison pages bring people who trade.
2. **Move from referral to affiliate programs.** Exchange affiliate programs pay a much higher share than plain referral links, but they want proof of an audience (traffic, X followers).
3. **Add income that doesn't depend on signups:** ad networks in the top bar, hardware-wallet affiliates, sponsored slots and newsletter sponsors.

**Ways to earn, in order:** exchange referrals (now) → AADS ad bar (live) → hardware-wallet affiliates and exchange affiliate programs → better crypto ad networks in the same bar (Bitmedia/Coinzilla) → sponsored "Featured" slot, always labeled and separate from the ranking → newsletter sponsors → broker/bond affiliates for the traditional-yields section. Sponsorship never changes the ranking, as the Terms promise.

**Traffic.** Search is the main engine. Build page types from data, so one template makes many pages: coin pages (exist), platform pages, where-to-buy pages, country pages, exchange comparisons, rate history, calculators and traditional-yield pages. Each page must carry its own data, not a swapped name; Google penalizes thin copy-paste pages. Guides stay evergreen and link to the live pages. X, Reddit/Quora and a newsletter bring the first visitors while search grows.

**Monthly check:**

| When     | Target                                                         |
| -------- | -------------------------------------------------------------- |
| Month 1  | Indexed by Google, ~1k visits                                  |
| Month 3  | ~10k visits/month; apply to affiliate programs                 |
| Month 6  | ~50k visits/month, 1k+ email subscribers                       |
| Month 12 | ~250k visits/month; re-check the $1M math against real numbers |

**Owner tasks outside the repo:** a separate brand Gmail (not a work account) that owns Search Console, analytics, the X developer app, ad networks and affiliate accounts (Search Console, Bing Webmaster Tools and Cloudflare Web Analytics are set up); registering on new platforms.

## AI search visibility

ChatGPT, Claude, Perplexity and Google AI answers search the web live and cite the pages they read. Nobody can pay to be included. What we can do is let their crawlers in, get indexed, and write pages that are easy to quote. A daily-updated, dated rate page is the kind of source they like to cite. This doesn't wait for Google: ChatGPT search relies mostly on Bing's index, and Claude and Perplexity run their own crawlers.

Done (2026-10-22): Cloudflare only serves DNS (grey cloud), so its bot blocking does not apply; robots.txt names the AI crawlers; coin pages have an answer line and `dateModified`; the deploy workflow sends an IndexNow ping when the rates change. If the Cloudflare proxy (orange cloud) is ever turned on, check AI Crawl Control and Bot Fight Mode first.

Done (2026-10-25): the site is in Bing Webmaster Tools (imported from Search Console); `/llms.txt` is generated at build time from data (`src/pages/llms.txt.ts`): what the site is, every coin page with its best rates, the calculator and the guides.

1. **Mentions:** AI answers cite Reddit and Quora a lot, so [Community answers](#community-answers) also helps here.
2. **Measure (from early December 2026):** track visits from chatgpt.com, perplexity.ai, claude.ai and copilot in Cloudflare Web Analytics. Once a month the owner asks the same 5 questions (for example "best USDT savings rate") in ChatGPT, Claude and Perplexity and notes whether YieldBasics is cited.

## Daily posts on X

X API prices (official docs, checked 2026-10-25; prices can change, see docs.x.com): $0.015 per post, $0.20 per post with a link, $0.010 per reply to a mention, $0.010 per DM read, $0.015 per DM sent, $0.001 per read of the account's own mentions, $0.010 per user profile. Repeat reads within one UTC day are free. $20 of credit after the first purchase. One text post a day is about $0.45/month; its reply with the link adds about $6/month (post the reply by hand to skip that).

Done (2026-10-25): the daily rates PR description has a "Post for X" block (one post a day, three rotating templates) and a reply with the links, which the owner copies into X by hand. The posting code (`npm run x:daily`, `src/utils/xApi.ts`) is ready and tested (see AGENTS.md).

1. **Image (optional):** a daily "today's best rates" card in the site's style, attached to the PR for the owner to download with the text. Posts with an image usually get more views.
2. **Automatic posting (when the owner wants it):** on developer.x.com, signed in as @Yield_Basics, create an app with "Read and write and Direct message" permission. Add `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN` and `X_ACCESS_SECRET` as repository secrets (never committed) and set a monthly spending cap (about $15). Then add a workflow that runs `npm run x:daily -- --previous <old rates.json>` after the rates PR is merged, and test it once with `DRY_RUN=1`.
3. **Inbox (after the keys):** `npm run x:inbox` downloads new DMs and mentions since the last check to a private file outside the repo; an agent summarizes offers, flags scams and drafts replies; `npm run x:reply` sends a reply only after the owner approves it. Light use is about $7.50/month.
4. Later: a weekly "biggest moves" post, and a post for each new guide (from `rss.xml`).
5. New deals: the same workflow posts each new entry in `src/data/deals.json` once its PR is merged, using the text from `npm run deals:post <id>` (today the owner pastes it by hand).

## Community answers

Answer real questions on Reddit (r/CryptoCurrency, r/stablecoins, r/personalfinance), Quora and X, linking to a rate page or the calculator only when it answers the question. The owner posts by hand, about 20 minutes a day; agents can draft answers. Automating posts breaks these sites' rules.

## Platform pages

New pages `/platforms/<id>`: every offer on that platform (reuse `RateTableRow.astro`), its earn product types, the referral bonus and a short evergreen overview (regulation, proof of reserves). Title, description and FAQ come from data, as in `src/utils/assetPages.ts`. Link them from the table rows and the footer. They match searches like "Bybit earn rates" and are easy for AI answers to quote. The countries section is added once the [countries data](#countries-data) exists, and a rate history chart once that exists.

## Countries data

- Add a `countries` block to each platform in `src/data/platforms.json`: the restricted countries, a link to the platform's terms, and the date it was checked. Tested helpers in `src/data/platforms.ts`.
- Show it on the platform pages. It is also needed for the country pages, the "available in my country" filter and the Russian version.

## Table filters and platform type switch

The table already filters by coin and term and sorts by rate. Add, in this order:

- a type switch: All · Exchanges · DeFi · Wallets (from `kind` in `platforms.json`; needs nothing new)
- a minimum lock period filter for fixed terms
- a platform picker and "available in my country" (after the [countries data](#countries-data))

Put the filter logic in `src/utils/yields.ts` with tests.

## Growth chart on the calculator

On `/apr-to-apy-calculator`, under the result, add a chart of the balance over 1–10 years: no compounding vs the chosen compounding. Use inline SVG, no chart library, working in both themes. Put the series maths in `src/utils/compounding.ts` with tests. Later reuse it on the coin pages.

## Where to buy pages

Start with keyword research using Google Trends, Keyword Planner and "People also ask", plus Search Console once it has data. Then build `/buy/<coin>` pages for the listed coins: exchanges that sell the coin, payment methods, trading fees (once the fees data exists) and countries. These pages bring buyers and traders, who earn the most commission.

## Market strip

A small strip under the header with BTC, ETH and a few top coin prices, the Crypto Fear & Greed Index and the offer count.

- Prices load in the visitor's browser from CoinGecko's free public API, with "Prices by CoinGecko" shown.
- Fear & Greed comes from `api.alternative.me/fng/`. Its terms require its name shown right next to the number.
- If a request fails, the strip hides that item. Add both services to the privacy page.

## Rate history chart

Done (2026-10-30): every daily run saves each offer's rate to `src/data/history/<yyyy-mm>.json` (see AGENTS.md), starting from 2026-10-14.

Next, once there are about 30 days: coin pages show a chart of the best flexible and best fixed rate over the last 90 days (inline SVG, both themes; the series maths in `src/utils/rateHistory.ts` with tests), and the platform pages a chart of their own offers. Nobody else publishes this history, so other sites have a reason to link here; it also powers the monthly report.

## Email signup and weekly digest

Start collecting subscribers early; the list grows like the history does. A signup form on the home page and the coin pages through a free tier (Buttondown, a hosted newsletter service: we embed its form, it stores the emails and sends the mail). The owner creates the account. A weekly digest generated from `rates.json` and the history data, sent by hand at first. Update the privacy page.

## First Search Console check

Around mid-November 2026, once Search Console has 3–4 weeks of data: check which pages are indexed, fix indexing errors, and note the first queries. A small PR, unlike the [full audit](#full-seo-audit-and-backlinks) later.

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

Done (2026-10-25): an AADS (A-Ads) ad bar sits above the header on every page (see AGENTS.md). The owner chose no consent banner for now; the Privacy page says AADS may set cookies. Next, when traffic grows: GA4 (the existing `analytics.vendors.googleAnalytics.id` and `Analytics.astro`) with click events on "View offer", a cookie consent banner for EU/UK visitors, and a better-paying network in the same bar (Bitmedia or Coinzilla, around 5–10k visits a month). Update the privacy page and the terms with each change.

## Sponsored slots and newsletter sponsors

A clearly labeled "Featured" slot sold to platforms, kept separate from the ranking, which stays by rate. Newsletter sponsors once the list has about 2k subscribers.

## More evergreen guides

New posts in `src/data/post/`, in the same style as the existing ones: no rate snapshots or tables, and they link to the `/rates/<coin>` pages instead. Planned:

- Flexible vs fixed-term earn
- CeFi vs DeFi earn (exchanges vs Aave-style protocols)
- How tiered rates work (why "up to X%" applies only to the first amount)
- How we collect rates (sources, daily updates, stale and manual rates)

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

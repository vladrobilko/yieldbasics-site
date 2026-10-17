# Roadmap

Planned work that isn't done yet, in priority order. Remove an item once its PR is merged.

1. [Fix the Bybit fetch on GitHub runners](#fix-the-bybit-fetch-on-github-runners): waiting on the owner's choice of proxy.
2. [Beginner help on the rates table](#beginner-help-on-the-rates-table)
3. [Trust lines on the About page](#trust-lines-on-the-about-page)
4. [More evergreen guides](#more-evergreen-guides)
5. [Watch the daily schedule](#watch-the-daily-schedule)
6. [Add more platforms](#add-more-platforms): waiting for the owner to register and send referral links.
7. [Russian version of the site (later)](#russian-version-of-the-site-later): after the English site has steady traffic.

## Fix the Bybit fetch on GitHub runners

**Problem.** Since 2026-10-14, every Bybit API host returns HTTP 403 to GitHub's US runners. That includes `api.bybit.com`, `api.bytick.com` and `api.bybitglobal.com`; the last was tested in a runner job on 2026-10-16 with `open_pr=false`. The daily job keeps Bybit's previous offers, so they slowly go stale. After 3 days they show a "Checked <date>" hint. A run from a non-US machine works (`npm run rates`).

**Workaround until it's fixed.** Run `npm run rates` locally from time to time and put the refreshed `src/data/rates.json` in a PR.

**Plan.**

1. Send Bybit requests from a non-US location. Preferred: a small Cloudflare Worker on the site owner's account.
   - It only forwards `GET /v5/earn/product?category=…` to `api.bybit.com`; any other path gets 403.
   - Its URL goes in a GitHub Actions secret, e.g. `BYBIT_PROXY_URL`. It is never committed.
   - Check first that the Worker's outbound IP isn't blocked as well. Cloudflare usually egresses near the caller, which may also be the US. If it is blocked, use a proxy in a fixed non-US region instead (a small cloud function in an EU or Asia region).
2. In `scripts/rates/sources/bybit.ts`, try the proxy last, after the direct hosts, when `process.env.BYBIT_PROXY_URL` is set. Reuse `fetchJsonWithFallback`. Local runs keep working without the variable.
3. Pass the secret to the "Fetch rates" step in `.github/workflows/update-rates.yaml`.
4. Verify: `gh workflow run update-rates.yaml --ref <branch> -f open_pr=false`, then check that the log shows `✓ bybit`.
5. Add a unit test for the host order (proxy used only when the variable is set). Update AGENTS.md.

**Decision needed from the owner:** which proxy and account to use. Don't create one without asking.

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

- Flexible vs fixed-term earn
- CeFi vs DeFi earn (exchanges vs Aave-style protocols)
- How tiered rates work (why "up to X%" applies only to the first amount)
- How we collect rates (sources, daily updates, stale and manual rates)

## Watch the daily schedule

The daily rates workflow moved to `17 5 * * *` on 2026-10-16, because runs scheduled on the hour started about 4 hours late. Check the start times of the next few runs (`gh run list --workflow update-rates.yaml`). If they still slip a lot, try another minute or hour.

## Add more platforms

**Status:** waiting for the site owner to register and send referral links. Research from 2026-10-17. Country lists come from third-party trackers, so confirm each platform's own terms and KYC when registering.

**For each platform, once its referral link arrives:**

1. Add it to `src/data/platforms.json` (name, kind, website, `referralUrl`, logo).
2. Find a rates source: an official public API first, then a public web JSON endpoint, then `scripts/rates/browser.ts` (as for MEXC). If none works, use `src/data/manual-rates.json`.
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

**Not suitable for the owner:** LBank, Toobit and Bitget (owner can't register). YouHodler and Nexo look unlikely; check before spending time on them.

## Russian version of the site (later)

Start only once the English site has steady traffic. The Russian-speaking audience (Russia, Belarus, Kazakhstan, Uzbekistan, the Caucasus, emigrants) is large and active in crypto, and Russian-language search has few comparisons of daily-updated earn rates. Income would come from the platforms already listed, many of which are popular with this audience.

**Plan, in steps:**

1. Add Russian versions of the home page and the `/rates/<coin>` pages only, under `/ru/`, with `hreflang` links between languages. The page text, FAQ answers (`src/utils/assetPages.ts`) and the table UI need translating; the rates data is shared.
2. Mark offers that aren't available to people in Russia or Belarus (for example, platforms that block those countries). This needs a per-platform list of restricted countries in `src/data/platforms.json`, kept up to date.
3. Measure traffic for a few months. Only then translate guides and other pages.

**Keep out:** Belarusian and Russian venues have no earn products (BYNEX, Whitebird, the Moscow and SPB stock exchanges), and some Russian exchanges are sanctioned or high-risk (Grinex, Rapira, ABCEX). Don't list them.

**Decision needed from the owner first:** check the advertising rules for crypto services in Russia and Belarus (Belarus blocked several exchange sites over advertising in December 2025), and whether the Russian pages could get the site blocked there.

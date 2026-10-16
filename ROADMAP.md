# Roadmap

Planned work that isn't done yet, in priority order. Remove an item once its PR is merged.

1. [Fix the Bybit fetch on GitHub runners](#fix-the-bybit-fetch-on-github-runners): waiting on the owner's choice of proxy.
2. [Beginner help on the rates table](#beginner-help-on-the-rates-table)
3. [Trust lines on the About page](#trust-lines-on-the-about-page)
4. [More evergreen guides](#more-evergreen-guides)
5. [Watch the daily schedule](#watch-the-daily-schedule)

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

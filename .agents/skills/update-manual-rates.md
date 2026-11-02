# Update Manual Rates (WEEX, Walt, Aave App, Bybit fixed terms)

WEEX and Walt (`telegram-wallet`) show earn rates only to signed-in users, and the Aave App only inside its mobile app (entries use `platformId: "aave"`, `product: "Aave App"`, next to the fetched Aave protocol rates). Bybit's fixed terms and new-user offer (`Fixed Savings`, `Fixed Rate Loan`) are only on bybit.com/en/earn/easy-earn, behind bot protection; its flexible and on-chain rates are fetched. OKX's new-user bonuses don't reach the GitHub runners (US), so they are kept by hand too; the caps are in the FAQ on okx.com/earn/simple-earn. Skip products marked "VIP Only". So the owner takes screenshots and an agent copies the rates into `src/data/manual-rates.json`. Manual offers drop off the site 30 days after their `verifiedAt`; the daily rates PR warns 7 days before ("Manual rates to re-check"). Aim to re-check every 2–3 days.

The rates come either from the owner's screenshots (below) or from the owner's own Chrome during `check-rates-in-browser.md`. **Never** sign in, type a password or solve a bot check yourself; the owner signs in. **Never** commit the screenshots (the repo is public).

## Where the screenshots are

Outside the repo, one folder per date and a subfolder per platform:

```
C:\Users\vladr\Documents\YieldBasics\manual-rates\
  2026-11-02\
    weex\      *.png / *.jpg
    walt\
    aave-app\
```

Use the newest date folder unless the owner names another. The folder date is the check date. Read every image (image files open like any other file). Fixed-term rates and amount tiers usually sit on their own screens, so a flexible-list screenshot does not re-date them.

## Steps

1. **List what's on screen.** For each screenshot, note every offer: coin, product name, term (flexible = `termDays: 0`), rate and APR/APY, amount tiers, caps (`maxAmount`), and whether it is for new users only (`audience: "new-user"`). If a value is cut off or unreadable, don't guess: list it under "Couldn't read".
2. **Match** each one to an entry in `src/data/manual-rates.json` by `platformId` + `asset` + `product` + `termDays` + `audience`.
   - **Same rate:** only set `verifiedAt` to the folder date.
   - **Changed:** update `rate`, `tiers`, `maxAmount` and `note` as shown, and set `verifiedAt`.
   - **New offer:** add it only if the coin is in `assets` in `src/data/yields.ts` (new-user offers included). Otherwise list it under "Skipped".
   - **Missing from the screenshots:** leave it, with its old `verifiedAt`. Never re-date a rate nobody saw. Remove it only if the screenshots clearly show the product is gone (e.g. the full earn list without it), and say so in the PR.
3. `rate` is the headline (highest) rate. Tiers use amounts in the coin (`max: null` for no upper limit). Keep the file's existing style: 2-space JSON, entries grouped by platform.
4. **Publish to `rates.json`:** `npm run rates:manual`. It rebuilds only the manual offers, keeps the fetched ones, and prints the change summary. Never edit `rates.json` by hand.
5. **Check:** `npm test`, then `npm run check`.
6. **PR:** branch `feature/claude/manual-rates-<yyyy-mm-dd>`, title `Update manual rates (<yyyy-mm-dd>)`. The body has:
   - a table of changes: offer, old → new
   - the offers re-dated with no change (a count per platform is enough)
   - "Skipped" and "Couldn't read" lists, if any
   - each platform's new drop-off date (oldest `verifiedAt` + 30 days)

   Show the owner the diff and merge after their OK, as with any PR.

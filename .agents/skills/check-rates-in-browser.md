# Check Rates in the Browser (twice a week)

The daily rates job (`npm run rates`, GitHub Action) updates everything a public API or page JSON can give. APIs still miss things: VIP-only or hidden products, bonus rates, new-user offers, products only shown to signed-in users. So about twice a week the owner opens their Chrome (Claude in Chrome extension connected) and an agent compares every platform's own earn page with the site, fixes what it can, and then drafts an X post and a Reddit post about the update.

## Before you start

- The owner has Chrome open with the extension connected (`/chrome` in Claude Code) and is already signed in where needed: WEEX, and Telegram Web for Walt. **Never** type a password, sign in, create an account, or solve a captcha or bot check yourself. If a page asks for any of that, stop and ask the owner.
- Read only. Never click Subscribe, Invest, Confirm or anything that moves money or changes settings. Decline non-essential cookies.
- In Telegram, open only the Walt mini app. Don't open or read chats.
- Work in a new tab and close it at the end.
- Start from fresh `master`: `git checkout master && git pull`, then `git checkout -b feature/claude/rates-check-<yyyy-mm-dd>`. Don't run `npm run rates`: the daily PR owns fetched data. Compare against `src/data/rates.json` on `master`.

## Platforms

| Platform | Page                                                       | How the site gets it                                                                           |
| -------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Binance  | binance.com/en/earn/simple-earn                            | automatic                                                                                      |
| Bybit    | bybit.com/en/earn/easy-earn                                | flexible and on-chain automatic; fixed terms and new-user offer manual                         |
| OKX      | okx.com/earn/simple-earn                                   | automatic                                                                                      |
| Gate     | gate.com/earn/simple-earn                                  | automatic (flexible bonuses are not covered yet)                                               |
| KuCoin   | kucoin.com/earn                                            | automatic                                                                                      |
| CoinW    | coinw.com/earn/crypto-savings                              | automatic                                                                                      |
| Aave     | app.aave.com/markets                                       | automatic, best chain via DefiLlama; Aave App offers manual from the owner's phone screenshots |
| WEEX     | weex.com/staking and weex.com/autoearn                     | manual                                                                                         |
| Walt     | web.telegram.org/k/#@walt, then the Walt button, then Earn | manual                                                                                         |

Only coins in `assets` in `src/data/yields.ts` matter. New-user offers count only for USDT and USDC.

## Steps

1. **Read each page.** Expand rows and click term chips to see every term's rate, hover tooltips for bonus tiers, open "View more". Note per coin: product, term, rate, tiers and caps, VIP-only or new-user labels, sold out.
2. **Compare** with `rates.json` and sort what you find:
   - **Manual platform changed** (WEEX, Walt, Bybit fixed terms): update `src/data/manual-rates.json` by the rules in `update-manual-rates.md` (re-date only what you saw, never edit `rates.json` by hand), then `npm run rates:manual`.
   - **Automatic source wrong or missing something:** find where the page gets it (network requests in the browser). If that JSON works without a browser session, fix the source in `scripts/rates/sources/` with a test and a trimmed real fixture, on its own `bugfix/claude/<platform>-<summary>` branch. If it is behind a login or bot protection, add the offer as a manual one and say so.
   - **Correctly left out:** VIP-only, structured or wealth products, conditional events (e.g. "net deposit ≥ 1,000"), new-user offers on other coins. List them, change nothing.
3. **Report to the owner** before any PR: one line per platform (OK / changed / problem), then a table of changes (offer, site → page). Ask about anything unclear.
4. **Check:** `npm test`, `npm run check`, and `npm run build` if code changed. Show the pages locally (`npm run dev`), then follow the usual PR flow (owner's OK before push).
5. **Draft the posts** (below) once the owner is happy with the update.

## X post

One post, at most 280 characters, about the 1–3 most useful changes from this check (a new high rate, a new offer, a rate that dropped, a bonus that ended). Name the platform, coin, rate, term and the main catch (cap, new users only, bonus period). Say the rates were checked today. No hashtag pile, at most one emoji. Put the link (`https://yieldbasics.com/rates/<coin>` or the platform page) in a separate reply text, like the daily `npm run x:daily` post does.

## Reddit post

A title and a body. The body is a short update a person would write: what changed this week across platforms, with dated numbers and the catches (caps, new-user only, lock-ups, rates paid in another token). 1–3 short paragraphs, or a short list if it is a roundup. End with "Rates and sources are on my site, it's in my profile." Add a link plus "Disclosure: I run YieldBasics." only if the owner says the subreddit allows links. Ask which subreddit if the owner didn't say, and keep to its rules.

## Writing rules (both posts)

The owner posts these under their own name, so they must not read as AI-written:

- Plain words, short sentences of uneven length, first person, contractions, a small opinion is fine ("I'd skip the 555% one, it's 2 days").
- No em dashes, no bold, no headings, straight quotes, sentence case, no placeholders like [link].
- Avoid: delve, crucial, key, vital, landscape, robust, seamless, unlock, leverage, navigate, game-changer, "not just X but Y", lists of three by habit, "-ing" tails ("..., making it great for..."), hype and superlatives, "In summary" endings, "Let me know if...".
- Every number must be dated or clearly from today's check. Mention risks plainly.

Give each text in its own ```text block so it pastes cleanly:

```
X post
----
<post>
----
Reply with link
----
<reply>
----
Reddit
----
<title>
<body>
----
```

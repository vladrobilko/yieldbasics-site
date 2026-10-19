# Roadmap

Planned work that isn't done yet. Remove an item once its PR is merged.

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

## Automatic X posts for new deals

**Today.** `npm run deals:post <id>` prints the post text and the owner posts it on X by hand.

**Idea.** A GitHub Action that posts each new entry in `src/data/deals.json` to X after the PR is merged.

**Cost and setup.** It needs a paid X API plan with write access. The API keys go in GitHub Actions secrets and are never committed. Only worth it once deals are added often.

**Decision needed from the owner:** whether the volume of deals justifies the X API cost.

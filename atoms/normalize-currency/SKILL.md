---
name: normalize-currency
description: Turn a set of amounts in different currencies into one auditable answer, or a clean per-currency breakdown, and never a blended figure. Dev-only test artifact — never installed by end users.
---

The workspace is already pinned — pass its `workspace_id` on every call below.

Group the input amounts by currency for the rate lookup **only** — keep every tagged row, since the rate found for a currency gets applied back to each of its rows later, not just to a subtotal.

Settle the target currency: the caller's value if given, otherwise the workspace's `identity.base_currency`. If both are absent, ask rather than guessing, or fall back to reporting per currency and say why.

Take the single-currency shortcut (report the one total, `resolution: single_currency`, no rate lookup) only when that one currency already equals the target currency, or when the mode is `per_currency`. A lone *foreign* currency, with conversion asked for, is not a shortcut — convert it like any other.

Read each non-target currency's rate: `well_get_schema({ root: "exchange_rates" })` once per session, then look up the pair as of the as-of date (default today). An exact-date rate → use it. No exact-date rate → use the most recent rate at or before the as-of date, and record that date — never a rate dated after it, and never an arbitrary nearby one. Check pair direction against the schema before dividing rather than multiplying.

A missing rate excludes that one currency — leave it out of the converted total, keep it in the per-currency breakdown, carry it in `excluded` with the reason, and mark the total `partial`. Never drop a currency silently.

Convert per row, then total: apply each currency's rate to every tagged row in that currency, not just to its subtotal, then sum the converted rows.

Emit the hand-off:

```yaml
target_currency: <ISO code or null>
as_of: <YYYY-MM-DD>
converted_total: <number or null>
per_currency:
  - currency: <ISO code>
    native_amount: <number>
    converted_amount: <number or null>
    rate: <number or null>
    rate_date: <YYYY-MM-DD or null>
    rate_is_exact: <true|false>
converted:
  - tag: <caller's row id>
    currency: <ISO code>
    native_amount: <number>
    converted_amount: <number or null>
excluded: [{ currency: <ISO code>, reason: <text> }, …]
partial: <true|false>
resolution: converted | per_currency | single_currency | unresolved
```

Verify before moving on: the single-currency shortcut was taken only when that currency already equalled the target or the mode was `per_currency`; every converted figure carries the rate and rate date used, with the fallback date stated when an exact-date rate wasn't available; no rate dated after the as-of date was used; a currency with no available rate was excluded explicitly and the total marked `partial`; no total blends currencies anywhere in the output.

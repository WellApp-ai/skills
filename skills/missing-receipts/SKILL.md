---
name: missing-receipts
description: Find invoices (and optionally transactions) with no source document attached — a compliance/expense-hygiene check backed by Well's MCP financial graph. Use when the user asks "which expenses are missing receipts", "find missing receipts", "compliance check on receipts", "which invoices have no document attached", "do we have documentation for all our expenses", or "missing documentation". This is a find-only check — it surfaces the gap but cannot fetch a missing receipt from a vendor portal or inbox. Requires a connected Well workspace with invoicing data; if none is connected, this skill walks the user through connecting one first.
---

# Find Missing Receipts with Well

## Purpose

Use Well's MCP tools to answer "do we have documentation for all our expenses?" by finding invoices with no attached source document (no receipt/bill PDF on file), backed by Well's synced financial graph rather than a manual folder-by-folder check.

## When to use this skill

Use this skill when the user asks things like:

- "Which expenses are missing receipts?"
- "Find missing receipts" / "missing documentation"
- "Compliance check on receipts"
- "Which invoices have no document attached?"
- "Do we have documentation for all our expenses?"

## When not to use this skill

Do not use this skill when:

- The user wants to reconcile a payment against an invoice (a payment with no matching invoice, or vice versa) — that's a matching problem, not a documentation-attachment problem. Use the `payment-invoice-lookup` skill instead.
- The user wants the missing receipt actually fetched or collected (from a vendor portal, email inbox, etc.) — this skill only finds the gap. It cannot auto-collect a document; say so plainly rather than attempting it.
- No Well MCP connection is available and the user does not want to set one up — say so instead of guessing.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one.
- A time window (e.g. "this quarter", "last 3 months") — default to the trailing 3 full months if unspecified.
- A payment-status filter (e.g. "just the unpaid ones") — default to all payment statuses if unspecified.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace.
- `well_query_records` — read `invoices`, and optionally `transactions`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them. This is especially important for the secondary transaction check below, since the exact relation name that exposes a transaction's linked documents is not fixed.
- `well_list_connectors` — how `connect-tools` surfaces install links.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

## Workflow

1. **Pin the workspace.** 
Call each list or read tool once per step, and render at most one widget card per turn. The cards refresh themselves. A card click executes server-side and prefills a message in the user's composer — rendering a card therefore ends the turn, and the sent message is how the routine resumes.

Confirm the Well MCP server is configured — if `well_list_workspaces` (or any `well_*` tool) is not available, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop until it's there.

Call `well_list_workspaces()`.
- Auth error → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry `well_list_workspaces()` yourself in the same turn and continue — do not ask the user to confirm they signed in.
- `success: false` with a non-auth error → retry once; on a second failure, do not invent a workspace — tell the user and give them `<well-app-base-url>` to open Well directly.
- Zero workspaces → the account has no workspace yet. Say so, point the user to Well to finish signing up, and return `resolution: unresolved`.
- `session.pinned_workspace_id` set, and THIS conversation established it (its own picker click or typed choice earlier in the conversation), and the user is not asking to pick or switch → use it silently, map it to its row, `resolution: user_picked`, skip straight to the hand-off. A non-empty `session.workspace_queue` alongside it means a multi-pick is mid-walk — hand off `multi_picked` with the pin first and the queue behind it.
- `session.pinned_workspace_id` set, but this conversation never rendered the picker nor took a typed choice → it's another conversation's leftover. Ignore it and resolve as if unset. Never mention it — "already pinned" is forbidden phrasing — and never skip the picker because of it.

Resolve without asking when you can:
- Exactly one workspace → use it, `resolution: single`. Say which one in one line; do not ask for confirmation and do not call `well_switch_workspace`.
- Several workspaces and a hint (a `workspace_id`, name, or company behind it) → match it exactly on `workspace_id`; otherwise case-insensitively on `workspace_name`, `identity.registered_name`, `identity.trade_name`, or — for a country hint such as "my US entity" — on `identity.country` (ISO code). Exactly one match → use it, `resolution: hint_matched`, say which one you matched, and call `well_switch_workspace({ workspace_id })` so a later call can't fall back to a sibling entity. Zero or several matches → fall to the picker below; never pick the closest name.
- A hint naming several entities ("FR and US", "both my companies") is a sequence, not an ambiguity — split it into fragments, match each exactly as above, keep the user's order. Every fragment matching exactly one distinct workspace, and at least two distinct workspaces matched → call `well_switch_workspace({ workspace_ids: [...] })` once, in that order — the first is pinned, the rest become the session's `workspace_queue` — `resolution: multi_picked`. Any fragment matching zero or several workspaces → fall to the picker; never resolve part of a compound hint and drop the rest silently.

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to find the expenses with no receipt attached" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

Resolve the next message after the card, in this order, never by re-asking:
- The message is the card's prefill ("Continue in <name>", or the multi form "— then …") → the click already pinned it server-side. Acknowledge in half a sentence and continue — never re-verify with an extra call, never call `well_switch_workspace` for it. A single name → `resolution: user_picked`; the multi form → `resolution: multi_picked`.
- The message names one or more workspaces in its own words → map each to its `workspace_id` from the earlier result — never a guessed id — then call `well_switch_workspace` yourself (`workspace_id` for one, `workspace_ids` for several, in the user's order). A name matching zero or several rows is asked about, never guessed.
- The message declines ("later", "not now") → `resolution: unresolved`. Say nothing was pinned and stop; do not call `well_wait_for_selection`, do not run any workspace-scoped call.
- Any other message that needs the workspace → call `well_wait_for_selection({ kind: "workspace", timeout_s: 10 })` once. `selected` → continue on `selection.workspace_id` (an empty `selection.workspace_queue` is `user_picked`, non-empty is `multi_picked`). `no_selection_yet` → one line asking to click the card, end the turn.

Emit the hand-off:

```yaml
workspace_id: <uuid>
workspace_name: <name or null>
is_primary: <true|false>
identity:
  registered_name: <value or null>
  trade_name: <value or null>
  country: <ISO code or null>
  base_currency: <ISO code or null>
  fiscal_year_start_month: <1-12 or null>
resolution: single | hint_matched | user_picked | multi_picked | unresolved
workspaces: [{ workspace_id, workspace_name, identity, ... }, …]  # multi_picked only — pinned entry first, then the queue in order
```

On `unresolved`, every other key is null. Pass `workspace_id` explicitly on every `well_*` call from here on, pinned or not — a pin changes what an omitted argument falls back to, it does not make the argument optional.

On `multi_picked`: the caller runs its whole walk on the pinned workspace first, then calls `well_switch_workspace({ workspace_id: <next> })` on the next queue entry (read from `well_list_workspaces`' `session.workspace_queue`, never from chat) and repeats. Each pass carries its own `workspace_id` explicitly and gets its own recap — nothing is merged across two entities: no shared row, no combined total.

Verify before moving on: exactly one workspace is pinned, or `resolution: unresolved` — never two, never a merged view; `session.pinned_workspace_id` was trusted only when this conversation established it; a hint resolved only on an exact id match or an unambiguous case-insensitive name match; `well_switch_workspace` was called exactly once on a hint match or typed pick and not at all for a pick the card itself already made; on `multi_picked`, the loop rule (one entity at a time, own recap, no merging) was stated in the hand-off.


2. **Confirm the connections this answer needs.** 
The workspace is already pinned — pass its `workspace_id` on the call below; do not re-resolve it here.

Read the current coverage in one call: `well_list_connectors({ workspace_id, from_selection: true })` when this run follows a vendor pick; `well_list_connectors({ workspace_id, kind })` when the job covers exactly one kind; `well_list_connectors({ workspace_id })` otherwise (one unscoped call for two or three kinds — one call renders one card, and a turn never renders two).

For each of the requested kinds —
- `invoicing`
- `accounting`
- `bank`
— keep only rows whose `direction` is `input` and whose `data_domains` contains that kind (never a display name or `category_id`), and read each qualifying row's state in this order, first match wins:
1. `to_configure` or `disabled` → **missing**.
2. `need_reconnect`, `error`, or `suspended` → **error** — offer `install_url` as a reconnect, not a first install.
3. `enabled` with `last_successful_sync_at` set → **connected** (note "data may be partial" if `sync_in_progress: true`).
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting**.

At least one **connected** row for a kind → connected, and name any **error** row for that same kind alongside it (a live connector does not cancel a dead one). Only **connecting** rows → connecting. Only **error** rows → error, name the connector, offer the reconnect link. No qualifying row → missing, including a `to_configure` row the user started but never finished.

This is a coverage read for a data skill, not a connect step: hand the per-kind states straight back in the same turn. No closing question, no `well_wait_for_selection`, no card acknowledgment to wait for. When a `required` kind is missing, say so in the hand-off.

On a transient `well_list_connectors` failure, retry once; on a second failure, do not invent coverage — say it's unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and hand the failure back to the caller with no coverage claim.

Hand off, kept for the caller and never printed as a block: per requested kind, its state (`connected`/`connecting`/`error`/`missing`), the connector(s) behind it, and the `install_url` to act on; `coverage` — `complete` when every requested kind is connected or connecting, `none` when none is (an all-`error` workspace is `none`, not `partial`), `partial` otherwise; `skipped_by_user`; `required` echoed back.

Verify before moving on: `well_list_connectors` was the only connector-listing tool called — no `well_query_records` on `workspace_connectors`, no provider-specific tool; each kind's state came from the four-line precedence above, not from a name or `is_connected` alone; `coverage: none` was used (not `partial`) when every requested kind was in error; a transient failure was retried once before the fallback link.

   - `coverage: none` → stop; there is nothing to check yet.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** Coverage reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices`. Zero rows means there is nothing to check for documentation yet — say so and stop, rather than reporting "no missing receipts" from an empty workspace.

4. **Resolve the scope.** Default to the trailing 3 full months if the user didn't give a window. If the user asked for a payment-status filter (e.g. "just unpaid ones"), carry it into the next step; otherwise include all payment statuses.

5. **Find invoices with no attached document.** Call `well_get_schema({ root: "invoices" })` first. Query `invoices` within the window (and payment-status filter, if any) where the `document` relation is null (`_is_null: true` on that field per the query tool's documented operators). Fields: `invoice_number`, `reference_number`, `issuer.name`, `receiver.name`, `grand_total`, `local_currency`, `issue_date`, `payment_status`. This is the primary, most reliable check for this skill.

6. **Optional deeper check: transactions with no linked document.** This is secondary — not required for a basic answer, and worth calling out as such to the user. `documents` link to `transactions` through a many-to-many join, not a direct foreign key, so call `well_get_schema({ root: "transactions" })` first to find the exact current field/relation name that exposes it — do not guess or hardcode a name. If found, query `transactions` within the same window for entries with no linked document, and report the count as an additional finding alongside the invoice results.

7. **Normalize currency.** 
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

   - `partial: true` means a currency had no rate in Well. Name it and say the total covers the rest, rather than letting a quietly smaller total read as complete.

8. **State the scope limit plainly.** Regardless of how many results are found, tell the user this skill only finds the gap — it cannot fetch or collect the missing receipt from a vendor portal, email, or anywhere else.

9. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "Which expenses are missing receipts?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- The window (and any payment-status filter) used.
- A count of invoices missing a document.
- A list of the affected invoices (issuer/receiver, amount, currency, issue date, invoice number), capped at 20 — if more exist, state the total count and that the list was capped.
- If the secondary transaction check was run, a one-line note on how many transactions have no linked document.
- An explicit one-line statement that this is a find-only check: auto-collection of a missing receipt is not available.
- Whether the picture is complete: which relevant connector categories (invoicing/bills for the primary invoice check, banking or accounting for the secondary transaction check) are connected versus still missing, so the user knows whether this covers every expense they hold or only the invoices gated by what's connected today.
- A one-line pointer to `payment-invoice-lookup` for the matching problem — a payment with no invoice behind it, rather than an invoice with no document attached.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 9's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the rows in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from the pinned hand-off, and its `workspace_id` rode every `well_*` call.
- Connection state came from the coverage hand-off, and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- `well_get_schema` was called before querying any root for the first time, including before attempting the secondary transaction check.
- The `invoices.document` relation was checked with a real null-filter, not a guessed field name.
- If the secondary transaction check was attempted, the relation name was discovered from the schema, not hardcoded.
- Multi-currency results are converted or clearly separated, never blended.
- Every number carries a currency and a date.
- Which connector categories (invoicing/bills, banking or accounting) are connected versus missing was stated from the coverage hand-off, so the user knows whether the picture is complete or partial.
- The "find-only, no auto-collect" limitation was stated plainly in the output, not implied.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"Which expenses are missing receipts this quarter?"

### Expected behavior

Pin the workspace, confirm connections, and spot-check that rows have landed; query `invoices` for the trailing 3 months where `document` is null, and return something like "14 invoices in the trailing 3 months have no document attached: $6,100 USD, €1,450 EUR, and $690 CAD" — never a blended $8,240-style total — followed by a capped list (issuer, amount, currency, date, invoice number) and the explicit note that this skill cannot fetch the missing receipts itself — only surface them.

### Example request

"Do we have documentation for all our expenses last month?"

### Expected behavior

Pin the workspace, run the same query scoped to last month, and if zero invoices come back with a null `document`, report a clean bill of health ("all N invoices from last month have a document attached") rather than an empty, unexplained list — still note the find-only scope limit for completeness.

## Voice

<!-- voice:begin -->
Write like a brilliant, understated operations colleague. Hold the tone professional and casual at the same time, confident but never arrogant, credible but easy to follow, warm but never cute. This governs every message of the run, whichever step produced it. Precedence is fixed: when a step hands you an exact string to write, write it exactly as given, dashes and capitals included; these rules govern the prose you compose yourself.

Lead with the outcome, then the detail behind it. Write short active sentences a non-technical reader understands. Use sentence case for the headings and labels you write yourself. Name a real button or card label exactly as the app renders it, such as Use, Validate, Continue, or Deploy, so the user reads the same word on screen. Prefer a concrete number or a real example over an abstract claim.

Never write an em dash or an en dash. Use a period, a comma, or a colon instead. Never write an exclamation mark or an emoji. Keep an acknowledgement brief and specific, such as "Got it, pulling those invoices now." Skip preamble, superlatives, and self-praise.

Drop the habits that make an answer sound generic:

- Hedging transitions, such as "Furthermore", "Moreover", "Additionally", or "In today's fast-paced landscape".
- Buzzwords, such as leverage, delve, harness, foster, revolutionize, revolutionise, streamline, optimize, optimise, seamless, game-changer, cutting-edge, best-in-class, world-class, unparalleled, disruptive, synergy, blockchain, and crypto.
- Hollow contrast, such as "not just X, but Y".
- Vague praise, such as powerful, robust, intelligent, frictionless, elegant, or advanced.

Reach for these verbs first: ask, drop, connect, get, surface, compose, share, route, enrich, learn, reconcile, match, flag.

Keep to the house words in what you write to the user. Write "connect", never "integrate". Write "sessions", never "chat". Write "business data", never "financial data". Write "tokens", never "credits". Name every object by its own name, the workspace, the connector, the company, or the invoice, and never show the user a raw id on its own. A Well app address is a link, not an id, so keep it whole even when it carries a workspace id.
<!-- voice:end -->

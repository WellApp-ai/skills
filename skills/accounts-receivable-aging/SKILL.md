---
name: accounts-receivable-aging
description: Answer "who owes us money, and since when?" using Well's MCP financial graph — every outstanding customer invoice bucketed into standard aging bands (current, 1-30, 31-60, 61-90, 90+ days overdue), backed by real invoice data rather than guesswork. Use when the user asks "who owes us money", "accounts receivable aging", "AR aging", "outstanding receivables", "which customers haven't paid", "who's late paying us", or "overdue invoices owed to us". Requires a connected Well workspace with invoicing data and a resolvable `own_company`; if either is missing, this skill walks the user through connecting one or confirming their company first.
---

# Track Who Owes You Money with Well

## Purpose

Use Well's MCP tools to answer "who owes us money, and since when?" — every unpaid or partially-paid invoice this workspace has issued to a customer, bucketed by how overdue it is. This is the receivable mirror of `bills-due` (what this workspace owes others); this skill covers the opposite direction, backed by Well's synced invoice data, not a guess.

## When to use this skill

Use this skill when the user asks things like:

- "Who owes us money?" / "What's our AR aging?"
- "Which customers haven't paid us?"
- "Who's late paying us?" / "Show me overdue invoices owed to us"
- "What are our outstanding receivables?"

## When not to use this skill

Do not use this skill when:

- The user wants to know who **they** owe (accounts payable) — use the sibling `bills-due` skill (a date-sorted AP planning view) instead.
- The user wants a cash/runway answer — use `runway` instead.
- The user wants a deep dive on one specific customer's full history, not an aging summary across all customers — use the sibling `company-profile` skill instead.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one.
- A specific customer to filter to — default to all customers with an outstanding balance.
- How the result should be grouped — default to per-invoice within each aging bucket; group by customer (worst bucket per customer) only if the user asks for a customer-level summary.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces`, `well_list_connectors` — read by the workspace and connection steps below.
- `well_query_records` — read `invoices`, `workspaces` (for `own_company`), `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- Well's OAuth / Dynamic Client Registration (DCR) flow — most hosts trigger it automatically when the Well MCP server is added.

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

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to age the invoices your customers still owe" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

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
— keep only rows whose `direction` is `input` and whose `data_domains` contains that kind (never a display name or `category_id`), and read each qualifying row's state in this order, first match wins:
1. `to_configure` or `disabled` → **missing**.
2. `need_reconnect`, `error`, or `suspended` → **error** — offer `install_url` as a reconnect, not a first install.
3. `enabled` with `last_successful_sync_at` set → **connected** (note "data may be partial" if `sync_in_progress: true`).
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting** — treat as connected for the run.

At least one **connected** row for a kind → connected, and name any **error** row for that same kind alongside it (a live connector does not cancel a dead one). Only **connecting** rows → connecting. Only **error** rows → error, name the connector, offer the reconnect link. No qualifying row → missing, including a `to_configure` row the user started but never finished.

This is a coverage read for a data skill, not a connect step: hand the per-kind states straight back in the same turn and keep going. No closing question, no `well_wait_for_selection`, no card acknowledgment to wait for. When a `required` kind is missing, say so in the hand-off and let the caller decide what to do — do not turn the read into a stop.

On a transient `well_list_connectors` failure, retry once; on a second failure, do not invent coverage — say it's unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and hand the failure back to the caller with no coverage claim.

Hand off, kept for the caller and never printed as a block: per requested kind, its state (`connected`/`connecting`/`error`/`missing`), the connector(s) behind it, and the `install_url` to act on; `coverage` — `complete` when every requested kind is connected or connecting, `none` when none is (an all-`error` workspace is `none`, not `partial`), `partial` otherwise; `skipped_by_user`; `required` echoed back.

Verify before moving on: `well_list_connectors` was the only connector-listing tool called — no `well_query_records` on `workspace_connectors`, no provider-specific tool; each kind's state came from the four-line precedence above, not from a name or `is_connected` alone; `coverage: none` was used (not `partial`) when every requested kind was in error; a transient failure was retried once before the fallback link.

   - `coverage: none` → stop; there is nothing to age yet.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** Coverage reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices`. Zero rows means the workspace has no invoices synced yet — say so and stop, rather than reporting an empty aging table as a clean one.

4. **Resolve your own company.** 
The workspace is already pinned — pass its `workspace_id` on every call below.

Read the schema, then the field: `well_get_schema({ root: "workspaces" })`, then `workspaces.own_company` for the pinned workspace. Treat all three of these as unresolved, never only the null case: the relation is `null`; the field is absent from the schema entirely; or it resolves to more than one plausible company. Never infer it from the workspace's name, title, logo, slug, or email domain — a coincidence is not a record, and an inferred pick is indistinguishable from a correct one in the output.

Resolved cleanly → take it. One unambiguous company from the schema field → `resolution: schema_field`. Say which company in one line and don't ask for confirmation either way.

Unresolved → ask once. Query `companies` for the workspace and ask which one is theirs, with the list on screen, saying why — "to tell the invoices you issued from the ones you received" and what a wrong pick breaks — "turns payables into receivables". Then, on the user's explicit confirmation of one company:
The answer holds for this run only → `resolution: user_confirmed`, `persisted: false`. If the user wants it set permanently, point them at `<well-app-base-url>/workspaces/<workspace_id>`, where the picker in the Well app writes it.
If the user declines, return `resolution: unresolved` and restate "state plainly that receivables can't be isolated from the full invoice list until it's set" so they know what they still get — never fall back to a guess.

Fold in duplicate company records: one legal entity often has several `companies` rows differing only by a legal-form prefix/suffix, punctuation, or accents. Normalize both sides identically — Unicode NFD, strip combining marks, lowercase, replace punctuation/separators with a space, collapse whitespace, trim — then treat a pair as a candidate when *either* normalized name contains the other (containment is directional: test both ways, or an alias like an `EI-` prefix is missed one direction). Propose the candidates, take an explicit yes before treating the confirmed set as one identity, and flag the duplicate as worth fixing in Well. Never merge silently.

Emit the hand-off:

```yaml
workspace_id: <uuid>
own_company_id: <uuid or null>
own_company_name: <name or null>
identity_set: [<uuid>, …]
aliases: [{ id: <uuid>, name: <name> }, …]
counterparty_alias_sets: [[{ id: <uuid>, name: <name> }, …], …]
resolution: schema_field | user_confirmed | suggested | unresolved
persisted: <true|false>
```

`identity_set` is the own company plus every confirmed alias — the key a caller compares invoice ids against. `persisted` is `true` whenever the anchor is stored server-side — `schema_field`/`suggested` (both read the stored setting), and a `user_confirmed` answer written with `well_set_own_company` in persist mode — `false` for a `user_confirmed` answer that held for this run only. On `unresolved`, every key but `workspace_id` is null or empty.

Verify before moving on: all three unresolved states were treated as unresolved (null, absent, ambiguous); the own company was never derived from the workspace's name, logo, slug, or domain; alias candidates were found with both-direction containment on identically normalized names and proposed, never merged silently; no write tool (`well_update_company`, `well_delete_company`) was called except `well_set_own_company` in persist mode on an explicit confirmation; a decline returned `resolution: unresolved` with no guess substituted.

   - Use its `identity_set` — the own company plus every confirmed alias — for every issuer/receiver comparison below.
   - `resolution: unresolved` means the user declined to confirm. Say plainly that receivables can't be isolated from the full invoice list until it's set, and stop rather than aging both sides together.

5. **Query outstanding receivables.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — this skill relies on `payment_status`, a separate dimension from lifecycle `status`, and field behavior can vary by connector). Query `invoices` where `issuer_company_id` matches the `identity_set` from `confirm-my-company` and `payment_status` is `unpaid` or `partial`. Include `receiver.name`, `grand_total`, `balance_due`, `local_currency`, `due_date`, `issue_date`, `invoice_number`.
   - Some connectors emit rows carrying `status: paid` alongside `payment_status: unpaid`. That combination is normal for those sources, not a data fault — `payment_status` is authoritative. Note the mismatch once in a clause if it's widespread, rather than discrediting the whole aging over it.
   - **Don't let an equality filter hide rows — and don't over-collect either.** A filter on `issuer_company_id` silently drops invoices where it is `null`. Query that bucket separately, then split it on the *receiver* before aging anything, because a null issuer alone does not make a row a receivable:
     - **Receiver is the own-company identity** → an invoice *addressed to* the workspace that lost its issuer. That is a bill owed, not money owed to us. Leave it out of the aging and point the user at `bills-due`.
     - **Receiver is an external company** → genuinely unresolved, and a receivable on the balance of evidence. Age it as a labeled row ("unattributed — issuer not recorded") inside the buckets: a large unattributed receivable sitting in 90+ is exactly what this skill exists to surface.
     - **Receiver is null too** → nothing places this row on either side. Report it as a separate unsplit line with a count and total, outside the buckets and outside the total outstanding.
   - **Invoices whose issuer and receiver are the same company** are owed by nobody. Keep them out of the aging and out of the total outstanding, and note them once as a data-quality issue worth fixing in Well.

6. **Compute aging and bucket.** For each invoice, days overdue = today minus `due_date`. There is no `paid_date` field on `invoices` — do not invent one. If `due_date` is null, fall back to `issue_date` and say so explicitly in the output. Bucket every invoice into one of: **current** (not yet due), **1-30**, **31-60**, **61-90**, **90+** days overdue. Present per-invoice, sorted by days-overdue descending within each bucket; only switch to a per-customer view (worst bucket per customer) if the user asked for a customer-level summary.

7. **Normalize currency.** If results span more than one currency, 
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
   - Build any per-row figure from its `converted` entries, matched back by tag, rather than re-applying rates yourself.

8. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "Who owes us money?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- The as-of date the aging was computed against.
- Aging buckets (current, 1-30, 31-60, 61-90, 90+) each listing customer name, amount, currency, due date, and days overdue per invoice (or per customer if a customer-level summary was requested).
- A total outstanding receivables figure, with currency.
- A one-line note on how "days overdue" was computed — `due_date`, or `issue_date` fallback if any invoices lacked a due date.
- Whether the picture is complete: which relevant connector categories (invoicing/accounting) are connected versus still missing — read off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own — and whether the workspace's own company is set, read off `confirm-my-company`'s hand-off, so the user knows whether this reflects their full receivables or a partial view gated by what's connected today.
- A one-line pointer to `company-profile` for a deep dive on any single overdue customer's full history.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 8's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the aging figures in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off, and its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off, and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- The own company came from `confirm-my-company`'s hand-off — its `identity_set`, not a value resolved here — and on `resolution: unresolved` the documented fallback ran rather than a guess.
- Duplicate company records were folded by `confirm-my-company`, which proposes them for an explicit yes; none were merged silently here, and no `well_update_company`/`well_delete_company` call was made.
- Null-`issuer_company_id` invoices were split on the receiver before aging: own-company receiver routed to payables and excluded, external receiver aged as a labeled row, both-null reported as a separate unsplit line outside the total outstanding.
- Invoices whose issuer equals their receiver were kept out of the aging and out of the total outstanding.
- `well_get_schema` was called on `invoices` before querying it, even if it was queried earlier for a different purpose.
- Only invoices where the workspace is **issuer** were counted — not receiver, which would be payable, not receivable.
- Every invoice is bucketed by days overdue, with the `due_date` vs. `issue_date` fallback stated when used.
- Multi-currency results are converted (with rate/date noted) or clearly separated, never blended.
- Every number carries a currency and an as-of date.
- Which connector categories (invoicing/accounting) are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"Who owes us money right now, and how overdue are they?"

### Expected behavior

Pin the workspace, confirm connections, and spot-check that rows have landed; resolve `own_company`, pull all `invoices` where this workspace is issuer and `payment_status` is `unpaid` or `partial`, bucket each by days overdue from `due_date`, and present the buckets (current, 1-30, 31-60, 61-90, 90+) with customer, amount, currency, due date, and days overdue per invoice, plus a total outstanding figure and as-of date.

### Example request

"What's our AR aging look like?" (asked on a workspace where `workspaces.own_company` has never been set)

### Expected behavior

Detect during step 4 that `own_company` is unresolved — whether it is null, missing from the schema altogether, or matches more than one company — and ask the user to confirm which company in Well is theirs rather than guessing which invoices are receivables versus payables. Matching the workspace's own name or logo against a `companies` row is a guess, not a resolution, and does not satisfy this step. Stop short of presenting a number until it's confirmed — or, if the user prefers, state the limitation plainly and offer the gross unpaid-invoice list unsplit as a caveated partial answer. Say that the confirmation holds for this run only, and link them to the Well app to set it permanently.

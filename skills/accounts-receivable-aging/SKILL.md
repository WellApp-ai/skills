---
name: accounts-receivable-aging
requires: [define-workspace, connect-tools, confirm-my-company, normalize-currency]
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

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- A specific customer to filter to — default to all customers with an outstanding balance.
- How the result should be grouped — default to per-invoice within each aging bucket; group by customer (worst bucket per customer) only if the user asks for a customer-level summary.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. This skill never calls it directly.
- `well_query_records` — read `invoices`, `workspaces` (for `own_company`), `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- `well_list_connectors` — how `connect-tools` surfaces install links. This skill never calls it directly.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Four atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.
- `confirm-my-company` — works out which company in the workspace is the user's own legal entity, folds in its duplicate records, and hands back the `identity_set` that decides which side of an invoice is a payable.
- `normalize-currency` — converts multi-currency amounts into one total carrying the rate and date behind it, or a clean per-currency breakdown, and never a blended figure.

All four ship with the `well-skills` plugin. This skill is also installable on its own. When a brick it needs is absent, the step that needs it says so and stops.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to age the invoices your customers still owe"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: there is nothing to age without a pinned workspace.
   - **If `define-workspace` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [invoicing, accounting]`, `required: []`, `mode: internal_check`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - `coverage: none` → stop; there is nothing to age yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices`. Zero rows means the workspace has no invoices synced yet — say so and stop, rather than reporting an empty aging table as a clean one.

4. **Resolve your own company — run `confirm-my-company`.** Invoke the `confirm-my-company` skill with the pinned `workspace_id`, `purpose: "to tell the invoices you issued from the ones you received"`, `consequence: "turns payables into receivables"`, and `on_decline: "state plainly that receivables can't be isolated from the full invoice list until it's set"`. That skill owns the three-way unresolved test (the relation is null, the field is absent from the schema entirely, or it resolves to more than one company), the never-infer rule, and the both-direction normalized containment that folds a legal entity's duplicate `companies` rows into one identity. Use its `identity_set` — the own company plus every confirmed alias — for every issuer/receiver comparison below.
   - `resolution: unresolved` means the user declined to confirm. Say plainly that receivables can't be isolated from the full invoice list until it's set, and stop rather than aging both sides together.
   - **If `confirm-my-company` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

5. **Query outstanding receivables.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — this skill relies on `payment_status`, a separate dimension from lifecycle `status`, and field behavior can vary by connector). Query `invoices` where `issuer_company_id` matches the `identity_set` from `confirm-my-company` and `payment_status` is `unpaid` or `partial`. Include `receiver.name`, `grand_total`, `balance_due`, `local_currency`, `due_date`, `issue_date`, `invoice_number`.
   - Some connectors emit rows carrying `status: paid` alongside `payment_status: unpaid`. That combination is normal for those sources, not a data fault — `payment_status` is authoritative. Note the mismatch once in a clause if it's widespread, rather than discrediting the whole aging over it.
   - **Don't let an equality filter hide rows — and don't over-collect either.** A filter on `issuer_company_id` silently drops invoices where it is `null`. Query that bucket separately, then split it on the *receiver* before aging anything, because a null issuer alone does not make a row a receivable:
     - **Receiver is the own-company identity** → an invoice *addressed to* the workspace that lost its issuer. That is a bill owed, not money owed to us. Leave it out of the aging and point the user at `bills-due`.
     - **Receiver is an external company** → genuinely unresolved, and a receivable on the balance of evidence. Age it as a labeled row ("unattributed, issuer not recorded") inside the buckets: a large unattributed receivable sitting in 90+ is exactly what this skill exists to surface.
     - **Receiver is null too** → nothing places this row on either side. Report it as a separate unsplit line with a count and total, outside the buckets and outside the total outstanding.
   - **Invoices whose issuer and receiver are the same company** are owed by nobody. Keep them out of the aging and out of the total outstanding, and note them once as a data-quality issue worth fixing in Well.

6. **Compute aging and bucket.** For each invoice, days overdue = today minus `due_date`. There is no `paid_date` field on `invoices` — do not invent one. If `due_date` is null, fall back to `issue_date` and say so explicitly in the output. Bucket every invoice into one of: **current** (not yet due), **1-30**, **31-60**, **61-90**, **90+** days overdue. Present per-invoice, sorted by days-overdue descending within each bucket; only switch to a per-customer view (worst bucket per customer) if the user asked for a customer-level summary.

7. **Normalize currency — run `normalize-currency`.** If results span more than one currency, invoke the `normalize-currency` skill with the pinned `workspace_id`, the tagged amounts (one tag per invoice), `target_currency` (default: the workspace's base currency), and `as_of` (default today). That skill owns the never-blend invariant, the rate read from `exchange_rates`, the most-recent-rate-at-or-before-`as_of` fallback, and the rule that every converted figure carries the rate and date behind it. Report its `converted_total` with those rates, or its `per_currency` breakdown — never a blended total. Build any per-row figure from its `converted` entries, matched back by tag, rather than re-applying rates yourself.
   - `partial: true` means a currency had no rate in Well. Name it and say the total covers the rest, rather than letting a quietly smaller total read as complete.
   - **If `normalize-currency` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

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

Run `define-workspace`, then `connect-tools`, and spot-check that rows have landed; resolve `own_company`, pull all `invoices` where this workspace is issuer and `payment_status` is `unpaid` or `partial`, bucket each by days overdue from `due_date`, and present the buckets (current, 1-30, 31-60, 61-90, 90+) with customer, amount, currency, due date, and days overdue per invoice, plus a total outstanding figure and as-of date.

### Example request

"What's our AR aging look like?" (asked on a workspace where `workspaces.own_company` has never been set)

### Expected behavior

Detect during step 4 that `own_company` is unresolved — whether it is null, missing from the schema altogether, or matches more than one company — and ask the user to confirm which company in Well is theirs rather than guessing which invoices are receivables versus payables. Matching the workspace's own name or logo against a `companies` row is a guess, not a resolution, and does not satisfy this step. Stop short of presenting a number until it's confirmed — or, if the user prefers, state the limitation plainly and offer the gross unpaid-invoice list unsplit as a caveated partial answer. Say that the confirmation holds for this run only, and link them to the Well app to set it permanently.

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

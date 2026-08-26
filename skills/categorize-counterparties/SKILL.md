---
name: categorize-counterparties
requires: [define-workspace]
description: Raise category coverage on the counterparties (suppliers and customers) behind one Well workspace's spend — for a given month's still-missing invoices, or workspace-wide across everything still uncategorized. Renders Well's counterparties card, where each listed row carries a catalog-category select, every pick saves immediately, and Continue hands the turn back; the skill reads one list, points at the card, and proposes categories only when the user explicitly asks it to. Use when the user asks to categorize or tag their suppliers, vendors, or counterparties, says "which suppliers have no category", "categorize the companies behind my spend", "clean up my vendor categories before I close the books", or when a fetch-missing-invoices flow reaches its counterparty categorization step. Never invents a category outside the catalog. Do not use to categorize individual transactions, to compute a spend figure, or to connect a tool.
---

# Categorize Counterparties with Well

## Purpose

The counterparties card is the categorization tool — not the model. One `well_list_counterparties` call renders the card; every row it lists carries a category select fed by Well's shared catalog; each pick the user makes in a row's select writes that company's category immediately, through the card's own `well_update_company` call, and the card's Continue button is how the user hands the turn back when they are done. This skill's whole job is that one read, one coverage line, one line on what categorizing does and does not change, one card-pointing line, and — on a standalone ask with the next skill installed — one pointer line, then the turn ends. It proposes nothing, enriches nothing, and asks for no confirmation, unless the user explicitly asks it to propose. The categorization step of Well's fetch-missing-invoices flow — it runs after `define-period` and before `show-missing-invoices`, which takes no hand-off from it — and a standalone clean-up skill on its own.

## When to use this skill

Use this skill when:

- The user asks to categorize, recategorize, or tag their suppliers, vendors, or counterparties ("categorize my suppliers", "tag the companies behind my spend", "put my vendors in categories").
- The user asks which counterparties have no category, or how complete their counterparty categorization is ("which suppliers have no category?", "how much of my spend is uncategorized?").
- The user wants the counterparty list cleaned up before a close ("clean up my vendor categories before I close the books").
- A calling flow (fetch missing invoices, a month-end review) reaches its counterparty categorization step and needs category coverage raised on the counterparties of the months it works in.

## When not to use this skill

Do not use this skill when:

- The user wants to categorize or recategorize an individual **transaction**, or a batch of transactions. Those carry Well's `transaction` category type; this skill only ever touches the `company` type, on a company record. Point them at the Well app.
- The user wants a figure — how much was spent, on what, per category. That is `expense-breakdown`; this skill counts coverage, it is not a spend report.
- The user wants to connect a bank, accounting tool, or invoicing portal — that is `connect-tools`.
- The user asks for one specific month, and that month is not resolved yet. A period-scoped run takes its `periods` from `define-period`; this skill resolves no month itself. The standalone ask is exempt: with no period at all, the run goes workspace-wide with `uncategorized_only: true`.
- The user wants the missing invoices themselves listed (`show-missing-invoices`), or Well to go and fetch them (`deploy-agents`).
- The user wants to create a new category. The catalog is Well's own shared list; this skill assigns from it and never adds to it.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`, or from the pin THIS conversation established, used silently. A pin another conversation left in the session is a leftover: ignore it, never mention it, and run `define-workspace` — its picker renders at the point of need, and no "which workspace?" question is asked in text.
- `periods` — the months to sweep, as a list of `{ calendar_year, calendar_month }`, when this skill runs inside a flow. At most 12. Take them from the `define-period` hand-off, or resync them from `well_list_workspaces`' `session.selected_periods` only when THIS conversation's click or typed choice wrote them. A selection another conversation left behind is a leftover too: ignore it and never announce it — "your session still has June 2026 selected" is forbidden phrasing. `well_list_counterparties` takes this argument explicitly; it does not read the session selection itself.
- No period at all — the standalone case. Run workspace-wide with `uncategorized_only: true` instead, which returns every uncategorized counterparty regardless of month.
- `purpose` — one line from the calling skill (e.g. "so every vendor behind the month's spend carries a category"), used when a question is asked. Optional.
- `bank_state` — the bank side's state from the same flow: the bank kind's `state` from `connect-tools`' hand-off, or `connect-bank`'s `state` — `connected`, `connecting`, `error`, or `missing`. Optional. It is the only thing that lets this skill name the connected side the list rests on; nothing it may call carries connector state, so with no `bank_state` the connected side stays unconfirmed.
- `focus` — a narrowing hint from the user, e.g. "just the big ones", "only the SaaS vendors". Optional; it matters only in the on-request proposal mode, where it trims which rows you propose on. It never changes what the tool returns.

`periods` and `uncategorized_only` are the two scopes and they are exclusive. Pass one. Never send both, and never send `uncategorized_only` alongside a period the caller gave you — that would silently answer a wider question than the one asked.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's `workspace_queue` name the sequence, and this skill always works on the currently pinned workspace only. The caller re-pins with `well_switch_workspace({ workspace_id })` between passes, and only when the next entry is a DIFFERENT workspace: a re-pin to the workspace already pinned records nothing new, and a one-entry `workspace_ids` re-pin replaces the queue and ends the walk at the entity it is on. This skill itself pins nothing and calls that tool never. Each pass gets its own read and its own card, and nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_counterparties` — the ONE read this skill makes on the card path. Input: `workspace_id` explicitly, plus **one** scope — either `periods: [{ calendar_year, calendar_month }, …]` (at most 12) or `uncategorized_only: true` (workspace-wide, capped at 50 rows and returning the real `total_count` alongside them). Output: `rows`, plus `mode`, `base_currency`, `row_count`, `total_count`, `categorized_count`, `uncategorized_count`, and `hints`. Read `hints`: it carries the tool's own disclosures — the coverage bound, the row cap, a truncated catalog, and a FAILED catalog read. On that last one the card renders no pickers at all, so say the categories are managed in the Well app rather than pointing at a select that is not on screen. Pass on what it says. Every row carries `company_id`, `name`, `domain`, `categories` (`[{ category_id, name }]`, empty when uncategorized), and `is_categorized`. The `periods` scope holds only the counterparties whose invoices that month is still MISSING. It is not the month's counterparties, and not the workspace's. It adds `periods_covered`, the month fields (`calendar_year`, `calendar_month`, `period_label`), and the month's figures: `tx_count` (that month's transactions missing an invoice), `base_total_amount` in `base_currency`, and `suggested_retrieval`. It lists a counterparty once per month, so `row_count` can exceed the distinct `total_count`. The `uncategorized_only` scope names no month, so it returns every one of those ROW fields as `null` and leaves `periods_covered` and `base_currency` out of the envelope altogether; on the `periods` scope, `base_total_amount` is `null` when an FX rate was missing. In MCP-Apps hosts the result renders the counterparties card: **the card is where categorization happens** — it lists the first 12 rows, each with a category select, names the remainder in a **More** line, and counts its footer out of the rows it shows rather than out of the read's totals. A pick writes immediately through the card's own `well_update_company` call, needs no confirmation from you, and the card refreshes itself to show each save. The card's **Continue** button writes nothing: it prefills a reply that hands the turn back to you once the user is done picking. Categorizing is a requirement of this step rather than an offer, so a flow that called this skill does not advance until the user's continue for this step arrives. The bar is the counterparties this read listed, never every counterparty in the workspace. Exception: when the scope holds nothing left to categorize (every row categorized, or no rows), the server attaches no card, and only the data comes back. Never re-aggregate the rows.
- The category catalog — the card's option list, and NOT something you hold. It travels in the `well_list_counterparties` result's `_meta`, which reaches the host and the card, never you. You need it only in the on-request proposal mode of step 5, and there you read it with the one exception to the tool ban below. The labels are minted during enrichment, so the list grows on its own; this skill assigns from it and never adds to it.
- `well_update_company` — the card's write. This skill itself calls it only in the on-request proposal mode, after the user confirms, one call per company: `workspace_id`, `company_id`, `category_ids: [<category_id>, …]`. **The array is a replace-set, not an append** — to add a category to a company that already has one, send the existing ids plus the new one. Nothing else on the company is touched.
- Well's OAuth / DCR flow — only when no Well connection exists yet (auth error on the first call).

**Hard tool bans.** Never call `well_get_entity` or `well_get_schema`. On the card path, never make any read beyond this skill's one `well_list_counterparties` call — no enrichment of the rows, no side lookup on a counterparty, no catalog read. The card already shows everything the user needs to pick a category; a `well_get_entity` call burns a turn on data the card already shows, and every extra widget-bearing call renders an unwanted card in the chat. `well_query_records` has exactly ONE exception, in step 5 only: once the user asks for proposals, read the catalog with `root: "categories"` and `whereClause: { category_type: { _eq: "company" } }`. That read renders a second card, so take it in that mode and nowhere else. Never call `well_invoke_connector_tool`, any other `well_create_*` / `well_update_*` / `well_delete_*` tool, or any close, lock, or posting tool.

**If `well_list_counterparties` is not in your toolset**, the Well server this host is connected to does not expose it yet. Say exactly that, hand off `resolution: unavailable`, and stop. Do not rebuild the list from `well_query_records` on `companies` and `transactions` — a hand-joined list is a different computation and would misreport coverage.

**If `well_update_company` does not accept `category_ids`** on this server, the on-request proposal mode cannot write. Check its declared input before you propose anything — do not discover it by attempting a write. Report the coverage you read, say plainly that this Well server exposes the counterparty list but not the category write yet, hand off `resolution: read_only`, and point at the Well app.

**What categorizing does and does not change.** A counterparty's category is how Well will decide how to retrieve that supplier's invoices; that routing is not live yet — `suggested_retrieval` on today's rows comes from whether Well matched a provider, not from the category. Never tell the user that categorizing a company changes how Well fetches its invoices right now.

**It changes no missing-invoice list either.** A gap list is bounded by TRANSACTION categorization — the expense nature carried on each transaction — while this skill writes the counterparty company's INDUSTRY labels, which are a separate field on a separate record. So a pick here unhides no gap and nothing after it has to be re-read. Never tell the user that categorizing will surface more missing invoices, and never call a gap list thin. What it does change is what Well knows about the vendors themselves.

**Composed skills.** One atomic Well skill owns the step before this one — invoke it, don't reimplement it:

- `define-workspace` — pins exactly one workspace and supplies the `workspace_id` every call here carries.

It ships with the `well-skills` plugin, and step 2 hands off to it whenever the caller passed no `workspace_id`. This skill never resolves a workspace itself.

## Workflow

Call each tool once per step. The card refreshes itself — never re-call a tool just to check progress or to count the user's picks.

1. **Confirm the MCP server is configured.** If no `well_*` tool is available, tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because both the counterparty list and the category catalog live in Well. Stop until it is there.

2. **Confirm the tools, the workspace, and the scope.** Require `well_list_counterparties` in the toolset — absent, hand off `resolution: unavailable` and stop. Require `workspace_id` — from the caller, or this conversation's own pin used silently; absent both, run `define-workspace` and never pick a workspace or ask for one in text here. That one workspace holds for the whole pass — pass it explicitly on every call. Decide the scope: the caller's `periods` when given, otherwise `uncategorized_only: true`. Session leftovers from another conversation — a pin, a period selection — are ignored and never mentioned.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **List the counterparties — one call, one card.** Call `well_list_counterparties` once, with `workspace_id` and the one scope. A transient failure → retry once; a second failure → step 6.
   - Nothing to categorize — every row already carries a category, or the result holds no rows → say one short sentence: "Every counterparty in this scope already carries a category." Add the pointer line only where the pointer rule in `Output requirements` applies. No card renders, so expect none and do not wait for one. Hand off `resolution: unchanged` with `coverage_before` as read — there is no coverage left to raise — and when a flow called this skill, return control to it immediately, in the same turn.

4. **Point at the card and end the turn.** The card is on screen, carrying a category select on each row it lists — the first 12, with the rest named in its More line. Say at most four plain sentences and stop:
   - One coverage line, shaped by the scope you passed. The `periods` scope returns both sides, so state `categorized_count` out of `row_count`. Name that denominator for what it is: the counterparties whose invoices the month is still missing, never the month's counterparties or the workspace's. Both figures count rows, and a multi-month window lists a counterparty once per month, so never divide by the distinct `total_count`. The `uncategorized_only` scope returns the uncategorized side alone, so state that count and nothing more: `total_count` is how many counterparties carry no category, never how many exist. Never build a ratio the read does not hold. On the `periods` scope, name the biggest uncategorized counterparty by `base_total_amount` (a `null` amount is "amount unavailable" — never converted, never summed across currencies). The `uncategorized_only` scope carries no amounts at all, so name no biggest row there. On `uncategorized_only`, add the read cap: the tool returns the first 50 rows against the real `total_count` — "173 have no category; this read lists the first 50" — so a capped list never reads as the whole set. State the card's own display cap beside it on either scope, because the card lists 12 rows and counts its footer out of those: a figure quoted over 34 or 50 rows, standing beside a footer counting out of 12, reads as a contradiction unless you say which denominator is which. Fold the connector disclosure into this same line: the list holds only the counterparties the connected tools brought in. Name the bank side only when the caller passed `bank_state`, and point at `connect-tools` when it says that side is missing or in error. With no `bank_state`, say the connected side is unconfirmed rather than naming one — the counterparty read carries no connector field, so a named side would be invented.
   - One line on what this changes: it changes what Well knows about the vendors, not which invoices are missing.
   - One card line: choosing a category in a row's select saves it immediately, so a pick needs no submit, and the card's **Continue** button is how the user hands the turn back when they are done.
   - One pointer line, the last sentence, on a standalone ask with `show-missing-invoices` installed: the next step per `Output requirements`. Inside a flow, hand control back to the caller instead; with no next skill installed, stop after the card line.
   - Nothing else. No proposal list, no per-row commentary, no "shall I apply", no restating rows the card shows, no re-read to report a delta — the card shows its own saves. Never branch on whether a card appeared: you cannot tell a host that drew it from one that did not, because the key announcing the card goes to the host and never reaches you. Write the coverage line so it stands on its own, and let the selects add to it wherever the host drew them.

5. **Propose only when the user explicitly asks.** This mode never starts on its own — a low coverage figure, a big row count, or the user's silence is not a request. When the user asks you to propose ("propose categories for me", "categorize them for me", "which category would you pick?"):
   - Read the catalog once, with the step-5 exception: `well_query_records({ root: "categories", whereClause: { category_type: { _eq: "company" } } })`. It renders a card of the labels, which is expected here. Then work from that catalog plus the rows' `name` and `domain`. **No other tool call** — no `well_get_entity` on the companies, no second counterparty read.
   - Propose at most 20 rows at a time, honoring `focus`: the company name, its spend, and one catalog category by name. Order them by spend on the `periods` scope; the `uncategorized_only` scope carries no amounts, so keep the order the read returned and quote no spend. Leave out any row you cannot place from its name and domain alone, and say you have no catalog match for it — never guess, never invent a category, never propose a name outside the catalog.
   - Ask in one line whether to apply, and **stop**. On the user's yes, call `well_update_company` once per confirmed company with the catalog `category_id` (replace-set: to add, send the existing ids plus the new one). Honor a partial yes exactly and record declines under `skipped_by_user`. Never retry a failed write silently — report that company's exact error and keep the rest.
   - Then defer back to the card for the rest: one line that the remaining rows can be picked directly in the card. Do not queue the next proposal batch unless the user asks again.

6. **On failure, redirect instead of guessing.** A transient error on the read is retried once; a second failure means you stop and do not substitute a hand-built list. The retry never applies to `well_update_company` — a retried write is a second replace-set, so surface the error instead. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows and edits the same categories there. Do not append a query parameter you have not confirmed the app reads.

## Output requirements

Return:

- On the card path, the whole answer is one to four plain sentences: the coverage line (with the read cap on the workspace-wide scope and the card's 12-row display cap on either), the line saying this changes what Well knows about the vendors and not which invoices are missing, the card-pointing line — a pick saves immediately and needs no submit, and Continue hands the turn back — and, where the pointer rule below applies, the pointer line. When step 3 found nothing to categorize, the whole answer is its one sentence, and the pointer line may follow it under the same rule; a calling flow gets control back in the same turn instead.
- The hand-off, kept for the calling flow and never printed: `workspace_id`; the `scope`; `coverage_before` as the read supports it — `categorized_count` out of `row_count` on a `periods` scope, the uncategorized `total_count` alone on an `uncategorized_only` scope; `resolution` — `rendered` (the card is on screen and picks save as they are made), `updated` (an on-request proposal pass wrote at least one confirmed row), `unchanged` (nothing to categorize, or the user declined every proposal), `read_only`, or `unavailable`. `changed` — the companies a proposal pass wrote, each with the category it received — and `skipped_by_user` exist only after a proposal pass. These keys are reasoning vocabulary for you and the calling flow; the hand-off travels as plain conversation, and the next skill re-reads what it needs from its own tool calls.
- Connector coverage in plain words, folded into the coverage line rather than added as a sentence of its own: the list holds only the counterparties the connected tools brought in. Bank data is what makes settled spend visible at all; an accounting or invoicing tool widens the list. Name the bank side only from a `bank_state` the caller passed, pointing at `connect-tools` when it is missing or in error; with none, say the connected side is unconfirmed. A coverage figure read over a partial list is not the whole picture, and this skill reads no connector state of its own.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `show-missing-invoices` skill is installed: "Which invoices are missing for this month?". Otherwise hand control back to the skill that called this one, or, when the user asked about categories on their own, stop after the card line.

Do not return:

- A proposed category list the user did not ask for, or any "shall I apply these?" question on the card path.
- Rows restated in text, or per-row commentary, under a rendered card.
- Any mention of a leftover session value — "your session still has June 2026 selected" and every variant of it is forbidden.
- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- A category name that is not in the catalog, or a write the user did not confirm in proposal mode.
- A total that mixes currencies, or a `null` amount silently counted as zero.
- A capped workspace-wide list presented as the whole set.
- A claim that categorizing changed how Well retrieves invoices today, that it will surface more missing invoices, or any description of a gap list as thin.
- A claim that there is nothing else to send, which denies the card's Continue button, or a coverage figure quoted beside the card's footer without saying which denominator is which.
- A counterparty list rebuilt from `companies` or `transactions` when `well_list_counterparties` was unavailable.
- Anything beyond the one sentence, and the pointer line the rule above allows, when the scope had nothing to categorize.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the counterparties card from one
that did not. Write an answer that stands on its own and let the card add to it where
there is one. State the counterparties in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- Exactly one counterparty read ran: one `well_list_counterparties` call with `workspace_id` and one scope (the caller's `periods`, at most 12, or `uncategorized_only: true` — never both). No re-read to check progress or report a delta.
- No `well_get_entity`, no `well_get_schema`, and no read beyond the one list call on the card path — no row enrichment, no side lookups, no catalog fetch. `well_query_records` ran only inside the step-5 proposal mode, only on the `categories` root filtered to `category_type: "company"`. No `well_invoke_connector_tool`, no other create / update / delete tool, no close, lock, or posting tool.
- On the card path the answer ended the turn at one coverage line, one line on what categorizing changes, one card-pointing line naming both the immediate save and the Continue button, and the pointer line where the pointer rule applies — no proposals, no per-row commentary, no confirmation question, no rows restated.
- The coverage line said the list holds what the connected tools brought in, named a side only from a `bank_state` the caller passed — unconfirmed otherwise, never a side inferred from the counterparty read — and pointed at `connect-tools` when that state was missing or in error.
- The pointer rule was applied as written: one pointer line on a standalone ask with `show-missing-invoices` installed, control back to the caller inside a flow, and a stop after the card line otherwise.
- The model proposed only after an explicit user request, from the rows' names and domains plus the company-category catalog read in that step, wrote only after a yes, honored partial yeses, recorded declines in `skipped_by_user`, treated `category_ids` as a replace-set, never retried a failed write silently — and then deferred back to the card.
- `workspace_id` came from the caller or this conversation's own pin; a leftover session pin or period selection from another conversation was ignored and never mentioned.
- The coverage figure matched the scope, and the `periods` denominator was named as the counterparties whose invoices the month is still missing: `categorized_count` out of `row_count` on `periods`, the uncategorized `total_count` alone on `uncategorized_only`, and no ratio the read did not hold. On the workspace-wide scope, the 50-row read cap and the real `total_count` were both stated, and no biggest row was named, because that scope carries no amounts. The card's 12-row display cap was stated on either scope, so no figure sits beside the card's footer as an unexplained second denominator. On `periods`, every `null` `base_total_amount` was "amount unavailable"; no amounts were converted or summed across currencies; the rows were used as returned.
- Every proposed category came from the company-category catalog by `category_id`; no category was invented and no unplaceable row got a guessed match.
- If `well_list_counterparties` was absent, the run ended at `unavailable` with nothing rebuilt from raw queries; if `well_update_company` had no `category_ids`, the proposal mode ended at `read_only` before any proposal.
- When the read showed nothing to categorize, the answer was the one sentence — plus the pointer line where the pointer rule applies — the hand-off was `resolution: unchanged`, no card was expected, and a calling flow got control back in the same turn.
- The answer claims no retrieval improvement (`suggested_retrieval` is provider-matched today), promises no newly surfaced missing invoices, and never calls a gap list thin.
- No yaml, JSON, or fenced code block appears anywhere.

## Examples

### Example request

The fetch-missing-invoices flow calls this skill with the Acme SAS `workspace_id`, `periods: [{ calendar_year: 2026, calendar_month: 3 }]`, and `bank_state: connected` from its own bank step. The tool returns 34 counterparties whose invoices March is still missing, 12 of them uncategorized, the largest being AWS at €4,120.

### Expected behavior

Call `well_list_counterparties({ workspace_id, periods: [{ calendar_year: 2026, calendar_month: 3 }] })` once. The card renders. Answer in three sentences — "**March 2026** — 34 counterparties still owe an invoice, and 22 of them carry a category, read over the connected bank feed; the biggest gap is AWS at €4,120, and the card lists the first 12 of the 34. This changes what Well knows about the vendors, not which invoices are missing. Pick a category in a row's select and it saves immediately; press Continue when you are done." — and end the turn. `bank_state` is what allows the bank side to be named at all: had the flow passed none, the line would say the connected side is unconfirmed. The flow called this skill, so control goes back to it rather than to a pointer line. Hand off `resolution: rendered`. No proposal for the 12, no extra tool call, no confirmation question.

### Example request

The card is on screen with 14 uncategorized rows. The model is tempted to look the companies up to categorize them better.

### Expected behavior

Do not. No `well_get_entity` per row, no `well_query_records` for context, no proposal list, and no "Shall I apply these 14?". The card's rows already carry the name, domain, and spend the user needs, each select writes on its own, and Continue is there for when the user is done. The turn already ended at the card line; the next move is the user's.

### Example request

"Which of my suppliers have no category?" — no period, no flow. The tool returns 50 rows with `total_count: 173`.

### Expected behavior

Run the standalone scope: `well_list_counterparties({ workspace_id, uncategorized_only: true })`. State the uncategorized count and both caps, never a ratio — "173 counterparties have no category — this read lists the first 50 of them, and the card shows the first 12. Categorizing tells Well more about the vendors; it does not change which invoices are missing. Pick a category on a row and it saves immediately; press Continue when you are done. Once these are placed: which invoices are missing for this month?" — and end the turn. No connected side is named, because no `bank_state` reached this standalone ask; say the connected side is unconfirmed if the user asks what the list rests on. The last sentence is the pointer line, so it appears here because `show-missing-invoices` is installed; without it the answer stops at the card line. Do not report "0 of 173 categorized": this scope never returns the categorized side, so the total number of counterparties is unknown here. Hand off `scope: { uncategorized_only: true }`, `resolution: rendered`.

### Example request

After the card renders, the user writes: "Propose categories for me."

### Expected behavior

Now, and only now, propose — read the company-category catalog with the step-5 exception, then work from it and the rows' names and domains, with no other tool call: at most 20 rows, biggest spend first where the scope carries amounts, one catalog category each, unplaceable rows named as unmatched. Ask in one line whether to apply and stop. On "all except Stripe", write the others with one `well_update_company` per company, record Stripe under `skipped_by_user`, and close by pointing back at the card for the remaining rows.

### Example request

The flow calls this skill and `well_list_counterparties` returns 28 rows, every one `is_categorized: true` — no card attached.

### Expected behavior

Say exactly one short sentence: "Every counterparty in this scope already carries a category." Hand off `resolution: unchanged` and return control to the flow in the same turn. No card is expected, no coverage caveat, no question.

### Example request

"Categorize my counterparties for last month" — `well_list_counterparties` is not in the toolset.

### Expected behavior

Say the Well server this host is connected to does not expose the counterparty list yet, and that it will not be approximated from `companies` and `transactions`. Hand off `resolution: unavailable` and stop. Do not call `well_query_records`.

---
name: categorize-counterparties
requires: [define-workspace]
description: Raise category coverage on the counterparties (suppliers and customers) behind one Well workspace's spend — for a given month, or workspace-wide across everything still uncategorized. Renders Well's counterparties card, where the user picks a catalog category on each row and every pick saves immediately; the skill reads one list, points at the card, and proposes categories only when the user explicitly asks it to. Use when the user asks to categorize or tag their suppliers, vendors, or counterparties, says "which suppliers have no category", "categorize the companies behind my spend", "clean up my vendor categories before I close the books", or when a fetch-missing-invoices flow needs coverage raised before it lists the gaps again. Never invents a category outside the catalog. Do not use to categorize individual transactions, to compute a spend figure, or to connect a tool.
---

# Categorize Counterparties with Well

## Purpose

The counterparties card is the categorization tool — not the model. One `well_list_counterparties` call renders the card; every row carries a category select fed by Well's shared catalog; each pick the user makes in a row's select writes that company's category immediately, through the card's own `well_update_company` call. This skill's whole job is that one read, one coverage line, one card-pointing line, and — on a standalone ask with the next skill installed — one pointer line, then the turn ends. It proposes nothing, enriches nothing, and asks for no confirmation, unless the user explicitly asks it to propose. The categorization step of Well's fetch-missing-invoices flow — it runs after `define-period` and its result is what `show-missing-invoices` reads next — and a standalone clean-up skill on its own.

## When to use this skill

Use this skill when:

- The user asks to categorize, recategorize, or tag their suppliers, vendors, or counterparties ("categorize my suppliers", "tag the companies behind my spend", "put my vendors in categories").
- The user asks which counterparties have no category, or how complete their counterparty categorization is ("which suppliers have no category?", "how much of my spend is uncategorized?").
- The user wants the counterparty list cleaned up before a close ("clean up my vendor categories before I close the books").
- A calling flow (fetch missing invoices, a month-end review) found its gap list thin and needs categorization coverage raised before it reads the list again.

## When not to use this skill

Do not use this skill when:

- The user wants to categorize or recategorize an individual **transaction**, or a batch of transactions. Those carry Well's `transaction` category type; this skill only ever touches the `company` type, on a company record. Point them at the Well app.
- The user wants a figure — how much was spent, on what, per category. That is `expense-breakdown`; this skill counts coverage, it is not a spend report.
- The user wants to connect a bank, accounting tool, or invoicing portal — that is `connect-tools`.
- The workspace is not pinned yet (`define-workspace`) or the month is not resolved yet (`define-period`). This skill resolves neither.
- The user wants the missing invoices themselves listed (`show-missing-invoices`), or Well to go and fetch them (`deploy-agents`).
- The user wants to create a new category. The catalog is Well's own shared list; this skill assigns from it and never adds to it.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`, or from the pin THIS conversation established, used silently. A pin another conversation left in the session is a leftover: ignore it, never mention it, and run `define-workspace` — its picker renders at the point of need, and no "which workspace?" question is asked in text.
- `periods` — the months to sweep, as a list of `{ calendar_year, calendar_month }`, when this skill runs inside a flow. At most 12. Take them from the `define-period` hand-off, or resync them from `well_list_workspaces`' `session.selected_periods` only when THIS conversation's click or typed choice wrote them. A selection another conversation left behind is a leftover too: ignore it and never announce it — "your session still has June 2026 selected" is forbidden phrasing. `well_list_counterparties` takes this argument explicitly; it does not read the session selection itself.
- No period at all — the standalone case. Run workspace-wide with `uncategorized_only: true` instead, which returns every uncategorized counterparty regardless of month.
- `purpose` — one line from the calling skill (e.g. "so the missing-invoice list stops hiding spend"), used when a question is asked. Optional.
- `focus` — a narrowing hint from the user, e.g. "just the big ones", "only the SaaS vendors". Optional; it matters only in the on-request proposal mode, where it trims which rows you propose on. It never changes what the tool returns.

`periods` and `uncategorized_only` are the two scopes and they are exclusive. Pass one. Never send both, and never send `uncategorized_only` alongside a period the caller gave you — that would silently answer a wider question than the one asked.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's `workspace_queue` name the sequence, and this skill always works on the currently pinned workspace only. The caller re-pins with `well_switch_workspace({ workspace_id })` between passes; each pass gets its own read and its own card, and nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_counterparties` — the ONE read this skill makes. Input: `workspace_id` explicitly, plus **one** scope — either `periods: [{ calendar_year, calendar_month }, …]` (at most 12) or `uncategorized_only: true` (workspace-wide, capped at 50 rows and returning the full `total` alongside them). Output: the rows, each one **one counterparty** already grouped by the server: `company_id`, `name`, `domain`, `tx_count`, `base_total_amount` (base currency, or `null`), `categories` (`[{ category_id, name }]`, empty when uncategorized), `is_categorized`, and `suggested_retrieval`. In MCP-Apps hosts the result renders the counterparties card, each row with a category select: **the card is where categorization happens** — a pick writes immediately through the card's own `well_update_company` call, needs no confirmation from you, and the card refreshes itself to show each save. Exception: when the scope holds nothing left to categorize (every row categorized, or no rows), the server attaches no card, and only the data comes back. Never re-aggregate the rows.
- The category catalog — **already inside the `well_list_counterparties` result**, at `meta.categoryCatalog`, each entry with its `category_id` and `name`. It is the same shared, non-extendable list the card's selects offer. Read it from the result and never fetch it any other way.
- `well_update_company` — the card's write. This skill itself calls it only in the on-request proposal mode, after the user confirms, one call per company: `workspace_id`, `company_id`, `relationships: { categories: [<category_id>, …] }`. **The array is a replace-set, not an append** — to add a category to a company that already has one, send the existing ids plus the new one. Nothing else on the company is touched.
- Well's OAuth / DCR flow — only when no Well connection exists yet (auth error on the first call).

**Hard tool bans.** Never call `well_query_records`, `well_get_entity`, or `well_get_schema`, and never make any read beyond this skill's one `well_list_counterparties` call — no enrichment of the rows, no side lookup on a counterparty, no catalog read. The card already shows everything the user needs to pick a category; a `well_get_entity` call burns a turn on data the card already shows, and every extra widget-bearing call renders an unwanted card in the chat. Never call `well_invoke_connector_tool`, any other `well_create_*` / `well_update_*` / `well_delete_*` tool, or any close, lock, or posting tool.

**If `well_list_counterparties` is not in your toolset**, the Well server this host is connected to does not expose it yet. Say exactly that, hand off `resolution: unavailable`, and stop. Do not rebuild the list from `well_query_records` on `companies` and `transactions` — a hand-joined list is a different computation and would misreport coverage.

**If `well_update_company` does not accept `relationships.categories`** on this server, the on-request proposal mode cannot write. Check its declared input before you propose anything — do not discover it by attempting a write. Report the coverage you read, say plainly that this Well server exposes the counterparty list but not the category write yet, hand off `resolution: read_only`, and point at the Well app.

**What categorizing does and does not change.** A counterparty's category is how Well will decide how to retrieve that supplier's invoices; that routing is not live yet — `suggested_retrieval` on today's rows comes from whether Well matched a provider, not from the category. Never tell the user that categorizing a company changes how Well fetches its invoices right now.

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

4. **Point at the card and end the turn.** The card is on screen with a category select on every row. Say at most three plain sentences and stop:
   - One coverage line, shaped by the scope you passed. The `periods` scope returns both sides, so state how many counterparties are categorized out of the total. The `uncategorized_only` scope returns the uncategorized side alone, so state that count and nothing more: `total` is how many counterparties carry no category, never how many exist. Never build a ratio the read does not hold. On either scope, name the biggest uncategorized counterparty by `base_total_amount` (a `null` amount is "amount unavailable" — never converted, never summed across currencies). On `uncategorized_only`, add the cap: the tool returns at most 50 rows against the real `total` — "173 have no category; the card shows the 50 largest" — so a capped list never reads as the whole set. Fold the connector disclosure into this same line: name which connected side the list rests on.
   - One card line: choosing a category in a row's select saves it immediately — there is nothing else to send.
   - One pointer line, the third sentence at most, on a standalone ask with `show-missing-invoices` installed: the next step per `Output requirements`. Inside a flow, hand control back to the caller instead; with no next skill installed, stop after the card line.
   - Nothing else. No proposal list, no per-row commentary, no "shall I apply", no restating rows the card shows, no re-read to report a delta — the card shows its own saves. Never branch on whether a card appeared: you cannot tell a host that drew it from one that did not, because the key announcing the card goes to the host and never reaches you. Write the coverage line so it stands on its own, and let the selects add to it wherever the host drew them.

5. **Propose only when the user explicitly asks.** This mode never starts on its own — a thin list, a big row count, or the user's silence is not a request. When the user asks you to propose ("propose categories for me", "categorize them for me", "which category would you pick?"):
   - Work from what you already hold: the rows' `name` and `domain` plus `meta.categoryCatalog` from the one read. **No extra tool call of any kind** — no `well_get_entity` on the companies, no `well_query_records`, no second list read.
   - Propose at most 20 rows at a time, biggest spend first, honoring `focus`: company name, its spend, and one catalog category by name. Leave out any row you cannot place from its name and domain alone, and say you have no catalog match for it — never guess, never invent a category, never propose a name outside the catalog.
   - Ask in one line whether to apply, and **stop**. On the user's yes, call `well_update_company` once per confirmed company with the catalog `category_id` (replace-set: to add, send the existing ids plus the new one). Honor a partial yes exactly and record declines under `skipped_by_user`. Never retry a failed write silently — report that company's exact error and keep the rest.
   - Then defer back to the card for the rest: one line that the remaining rows can be picked directly in the card. Do not queue the next proposal batch unless the user asks again.

6. **On failure, redirect instead of guessing.** A transient error on the read is retried once; a second failure means you stop and do not substitute a hand-built list. The retry never applies to `well_update_company` — a retried write is a second replace-set, so surface the error instead. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows and edits the same categories there. Do not append a query parameter you have not confirmed the app reads.

## Output requirements

Return:

- On the card path, the whole answer is one to three plain sentences: the coverage line (with the cap disclosure on the workspace-wide scope), the card-pointing line — picks save immediately, nothing else to send — and, where the pointer rule below applies, the pointer line. When step 3 found nothing to categorize, the whole answer is its one sentence, and the pointer line may follow it under the same rule; a calling flow gets control back in the same turn instead.
- The hand-off, kept for the calling flow and never printed: `workspace_id`; the `scope`; `coverage_before` as the read supports it — categorized out of the total on a `periods` scope, the uncategorized count alone on an `uncategorized_only` scope; `resolution` — `rendered` (the card is on screen and picks save as they are made), `updated` (an on-request proposal pass wrote at least one confirmed row), `unchanged` (nothing to categorize, or the user declined every proposal), `read_only`, or `unavailable`. `changed` — the companies a proposal pass wrote, each with the category it received — and `skipped_by_user` exist only after a proposal pass. These keys are reasoning vocabulary for you and the calling flow; the hand-off travels as plain conversation, and the next skill re-reads what it needs from its own tool calls.
- Connector coverage in plain words, folded into the coverage line rather than added as a sentence of its own: the list holds only the counterparties the connected tools brought in. Bank data is what makes settled spend visible at all; an accounting or invoicing tool widens the list. Say which side the list rests on, and point at `connect-tools` when the bank side is missing — a coverage figure read over a partial list is not the whole picture.
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
- A claim that categorizing changed how Well retrieves invoices today.
- A counterparty list rebuilt from `companies` or `transactions` when `well_list_counterparties` was unavailable.
- Anything beyond the one sentence, and the pointer line the rule above allows, when the scope had nothing to categorize.

## Quality checks

Before finishing, verify:

- Exactly one read ran: one `well_list_counterparties` call with `workspace_id` and one scope (the caller's `periods`, at most 12, or `uncategorized_only: true` — never both). No re-read to check progress or report a delta.
- No `well_query_records`, no `well_get_entity`, no `well_get_schema`, and no read of any kind beyond the one list call — no row enrichment, no side lookups, no catalog fetch. No `well_invoke_connector_tool`, no other create / update / delete tool, no close, lock, or posting tool.
- On the card path the answer ended the turn at one coverage line, one card-pointing line, and the pointer line where the pointer rule applies — no proposals, no per-row commentary, no confirmation question, no rows restated.
- The coverage line named which connected side the counterparty list rests on, and pointed at `connect-tools` when the bank side was missing.
- The pointer rule was applied as written: one pointer line on a standalone ask with `show-missing-invoices` installed, control back to the caller inside a flow, and a stop after the card line otherwise.
- The model proposed only after an explicit user request, from the rows' names and domains plus `meta.categoryCatalog` already in hand, wrote only after a yes, honored partial yeses, recorded declines in `skipped_by_user`, treated the categories array as a replace-set, never retried a failed write silently — and then deferred back to the card.
- `workspace_id` came from the caller or this conversation's own pin; a leftover session pin or period selection from another conversation was ignored and never mentioned.
- The coverage figure matched the scope: categorized out of the total on `periods`, the uncategorized count alone on `uncategorized_only`, and no ratio the read did not hold. On the workspace-wide scope, the 50-row cap and the real `total` were both stated; every `null` `base_total_amount` was "amount unavailable"; no amounts were converted or summed across currencies; the rows were used as returned.
- Every proposed category came from `meta.categoryCatalog` by `category_id`; no category was invented and no unplaceable row got a guessed match.
- If `well_list_counterparties` was absent, the run ended at `unavailable` with nothing rebuilt from raw queries; if `well_update_company` had no `relationships.categories`, the proposal mode ended at `read_only` before any proposal.
- When the read showed nothing to categorize, the answer was the one sentence — plus the pointer line where the pointer rule applies — the hand-off was `resolution: unchanged`, no card was expected, and a calling flow got control back in the same turn.
- The answer claims no retrieval improvement (`suggested_retrieval` is provider-matched today), and no yaml, JSON, or fenced code block appears anywhere.

## Examples

### Example request

The fetch-missing-invoices flow calls this skill with the Acme SAS `workspace_id` and `periods: [{ calendar_year: 2026, calendar_month: 3 }]`. The tool returns 34 counterparties, 12 uncategorized, the largest being AWS at €4,120.

### Expected behavior

Call `well_list_counterparties({ workspace_id, periods: [{ calendar_year: 2026, calendar_month: 3 }] })` once. The card renders. Answer in two sentences — "**March 2026** — 22 of 34 counterparties categorized from the connected bank and accounting feeds; the biggest gap is AWS at €4,120. Pick a category in a row's select and it saves immediately — nothing else to send." — and end the turn. The flow called this skill, so control goes back to it rather than to a pointer line. Hand off `resolution: rendered`. No proposal for the 12, no extra tool call, no confirmation question.

### Example request

The card is on screen with 14 uncategorized rows. The model is tempted to look the companies up to categorize them better.

### Expected behavior

Do not. No `well_get_entity` per row, no `well_query_records` for context, no proposal list, and no "Shall I apply these 14?". The card's rows already carry the name, domain, and spend the user needs, and each select writes on its own. The turn already ended at the card line; the next move is the user's.

### Example request

"Which of my suppliers have no category?" — no period, no flow. The tool returns 50 rows with `total: 173`.

### Expected behavior

Run the standalone scope: `well_list_counterparties({ workspace_id, uncategorized_only: true })`. State the uncategorized count and the cap, never a ratio — "173 counterparties have no category, read from the connected bank feed; the card shows the 50 largest. Pick a category on a row and it saves immediately. Once the gaps are closed: which invoices are missing for this month?" — and end the turn. The third sentence is the pointer line, so it appears here because `show-missing-invoices` is installed; without it the answer stops at the card line. Do not report "0 of 173 categorized": this scope never returns the categorized side, so the total number of counterparties is unknown here. Hand off `scope: { uncategorized_only: true }`, `resolution: rendered`.

### Example request

After the card renders, the user writes: "Propose categories for me."

### Expected behavior

Now, and only now, propose — from the rows' names and domains and the catalog already in hand, no extra tool call: at most 20 rows, biggest spend first, one catalog category each, unplaceable rows named as unmatched. Ask in one line whether to apply and stop. On "all except Stripe", write the others with one `well_update_company` per company, record Stripe under `skipped_by_user`, and close by pointing back at the card for the remaining rows.

### Example request

The flow calls this skill and `well_list_counterparties` returns 28 rows, every one `is_categorized: true` — no card attached.

### Expected behavior

Say exactly one short sentence: "Every counterparty in this scope already carries a category." Hand off `resolution: unchanged` and return control to the flow in the same turn. No card is expected, no coverage caveat, no question.

### Example request

"Categorize my counterparties for last month" — `well_list_counterparties` is not in the toolset.

### Expected behavior

Say the Well server this host is connected to does not expose the counterparty list yet, and that it will not be approximated from `companies` and `transactions`. Hand off `resolution: unavailable` and stop. Do not call `well_query_records`.

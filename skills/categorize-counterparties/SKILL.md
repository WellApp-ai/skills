---
name: categorize-counterparties
description: Raise category coverage on the counterparties (suppliers and customers) behind one Well workspace's spend — for a given month, or workspace-wide across everything still uncategorized. Reads Well's shared company-category catalog, proposes one category per company in reviewable batches, and writes only what the user explicitly confirms. Use when the user asks to categorize or tag their suppliers, vendors, or counterparties, says "which suppliers have no category", "categorize the companies behind my spend", "clean up my vendor categories before I close the books", or when a fetch-missing-invoices flow needs coverage raised before it lists the gaps again. Never mass-assigns and never invents a category outside the catalog. Do not use to categorize individual transactions, to compute a spend figure, or to connect a tool.
---

# Categorize Counterparties with Well

## Purpose

Answer "which of the companies behind my spend still have no category, and what should they be?" for exactly one workspace, then close the gap under the user's control. Read Well's counterparty list — for the flow's months, or workspace-wide for everything uncategorized — read the shared company-category catalog, propose one catalog category per uncategorized company in batches the user can actually review, write only the confirmed ones, and hand off the coverage delta. The categorization step of Well's fetch-missing-invoices flow — it runs after `define-period` and its result is what `show-missing-invoices` reads next — and a standalone clean-up skill on its own. It writes categories on companies and nothing else.

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

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; never resolve a workspace here.
- `periods` — the `define-period` hand-off, as a list of `{ calendar_year, calendar_month }`, when this skill runs inside a flow. At most 12. One month is the normal case; the list exists so a caller sweeping a quarter or a year passes them in one call.
- No period at all — the standalone case. Run workspace-wide with `uncategorized_only: true` instead, which returns every uncategorized counterparty regardless of month.
- `purpose` — one line from the calling skill (e.g. "so the missing-invoice list stops hiding spend"), used when a question is asked. Optional.
- `focus` — a narrowing hint from the user, e.g. "just the big ones", "only the SaaS vendors", a provider or company name. Optional; used to order and, if the user asked for it, to trim which rows you propose on. It never changes what the tool returns.

`periods` and `uncategorized_only` are the two scopes and they are exclusive. Pass one. Never send both, and never send `uncategorized_only` alongside a period the caller gave you — that would silently answer a wider question than the one asked.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_counterparties` — the read. Input: `workspace_id` explicitly, plus **one** scope — either `periods: [{ calendar_year, calendar_month }, …]` (at most 12) or `uncategorized_only: true` (workspace-wide, capped at 50 rows and returning the full `total` alongside them). Output: the rows, each one **one counterparty** already grouped by the server: `company_id`, `name`, `domain`, `tx_count` (settled transactions of theirs in scope), `base_total_amount` (their total in the workspace's base currency, or `null`), `categories` (`[{ category_id, name }]`, empty when uncategorized), `is_categorized`, and `suggested_retrieval` (`agent` · `connect` · `upload`). In MCP-Apps hosts the result renders a counterparties card. Never re-aggregate the rows.
- `well_get_schema` + `well_query_records` on root `categories` — the catalog. Call `well_get_schema({ root: "categories" })` once per session, then `well_query_records({ root: "categories", whereClause: { category_type: { _eq: "company" } } })` **once** and reuse the result for every batch. Each row carries `category_id` and `name`. Filter on `category_type: "company"` and on nothing else: the `transaction` rows in the same table belong to transaction categorization and assigning one to a company is a category error, not a near miss. This catalog is Well's own shared list, not per-workspace, so it is the same set for every workspace and it cannot be extended from here.
- `well_update_company` — the write, one call per company: `workspace_id`, `company_id`, and `relationships: { categories: [<category_id>, …] }`. **The array is a replace-set, not an append** — whatever you send becomes that company's complete category list, so to add a category to a company that already has one you send both ids, and sending one id drops the others. Nothing else on the company is touched.
- Well's OAuth / DCR flow — only when no Well connection exists yet (auth error on the first call).

**If `well_list_counterparties` is not in your toolset**, the Well server this host is connected to does not expose it yet. Say exactly that, emit the hand-off with `resolution: unavailable`, and stop. Do not rebuild the list from `well_query_records` on `companies` and `transactions` — a hand-joined list is a different computation with different grouping and a different notion of "in scope", and presenting it as this list would misreport coverage.

**If `well_update_company` does not accept `relationships.categories`** on this server, categorizing cannot be written from here. Check its declared input before you propose anything — do not discover it by attempting a write and do not ask the user to confirm a change the server cannot make. Report the coverage you read, say plainly that this Well server exposes the counterparty list but not the category write yet, hand off `resolution: read_only`, and point at the Well app.

**What categorizing does and does not change.** A counterparty's category is how Well will decide how to retrieve that supplier's invoices — connector, mailbox, agent, or paper with no connector at all. That routing is not live yet: `suggested_retrieval` on today's rows comes from whether Well matched a **provider** to the counterparty, not from its category. So categorizing makes that routing possible and makes the counterparty list complete; it does not change what `suggested_retrieval` says today. Never tell the user that categorizing a company changes how Well fetches its invoices right now.

Never call `well_invoke_connector_tool`, any other `well_create_*` / `well_update_*` / `well_delete_*` tool, or any close, lock, or posting tool. This skill reads two things and writes one field on companies the user named.

## Workflow

1. **Confirm the MCP server is configured.** If no `well_*` tool is available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because both the counterparty list and the category catalog live in Well. Stop until it is there; do not categorize from assumptions.

2. **Confirm the tools, the workspace, and the scope.** Require `well_list_counterparties` in the toolset — absent, hand off `resolution: unavailable` and stop (see Tooling). Require `workspace_id` from `define-workspace`; absent, run that skill first and never pick a workspace here. That one workspace holds for the whole run — pass it explicitly on every call and never widen the pass to a second one, however closely the entities are related. Then check whether `well_update_company` accepts `relationships.categories`; if it does not, you are on the read-only path — read the list, report coverage, hand off `read_only`, and do not open the confirm gate. Decide the scope: the caller's `periods` when given, otherwise `uncategorized_only: true`.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **List the counterparties.** Call `well_list_counterparties` once, with `workspace_id` and the one scope. A transient failure → retry once; a second failure → step 9.
   - On the `uncategorized_only` scope, say the cap out loud: the tool returns at most 50 rows and its `total` is how many uncategorized counterparties the workspace actually holds. When `total` exceeds the rows returned, say so in the same line — "50 of 173 shown" — so nobody reads a capped list as the whole picture. Offer to work through the rest in later passes.
   - Zero rows → nothing to do. Say so, and on the `periods` scope say which months you looked at. Distinguish the two reasons: every counterparty in scope is already categorized, or Well cannot see any counterparty here at all because no bank connector feeds this workspace. On the second, say that plainly, point at `connect-tools`, and if the user connects one, re-read the list yourself in the same turn and carry on — do not wait to be re-prompted. Either way, hand off `resolution: unchanged` with `coverage_before` equal to `coverage_after`.

4. **Report it once, in one line.** In an MCP-Apps host the result already renders the counterparties card — do not restate the rows under it. Either way, one summary line and then stop reading: how many counterparties are categorized out of the total, and the biggest uncategorized one by `base_total_amount`. Nothing else. A row whose `base_total_amount` is `null` has no rate for its currency — print **amount unavailable** for it, never convert it yourself, and never add native amounts of different currencies together.

5. **Read the catalog once.** `well_get_schema({ root: "categories" })`, then the one `well_query_records` call from Tooling. Keep the result for the whole run; do not re-read it per batch.
   - An empty catalog, or a catalog with nothing that fits any uncategorized row, means there is nothing to propose. Say that plainly, name what you could not place, and hand off `resolution: unchanged`. Do not invent a category, do not propose a name that is not in the catalog, and do not fall back to the closest-sounding one.

6. **Propose, in batches, and stop for an explicit yes.** Order the uncategorized rows by `base_total_amount` descending — biggest spend first, so the review effort lands where it matters — and apply `focus` if the user gave one. Take at most **20** rows per batch. For each row give exactly: the company name, its spend (`tx_count` and `base_total_amount`, or "amount unavailable"), and the one catalog category you propose, by its catalog name. Add a short reason only where the choice is not obvious. Then ask, in one line, whether to apply the batch — and **stop**.
   - This is the confirm gate and it is not optional. No `well_update_company` call happens before an explicit yes on the rows it covers. Do not batch-and-apply in one turn, do not apply "the obvious ones" ahead of the answer, and do not treat an earlier yes on batch one as consent for batch two.
   - Never propose a category for a row you cannot place. Leave it out of the batch and say you have no catalog match for it.
   - Accept a partial yes. "All except Stripe", "just the first three", "no, skip these" are all normal answers: apply exactly what the user named, record every row they declined under `skipped_by_user`, and move on without re-asking.
   - A row that is already categorized is not part of the proposal. Only re-propose one when the user asked to change it, and then say what its current category is and that the write replaces it.

7. **Write the confirmed rows, one company at a time.** For each confirmed row call `well_update_company({ workspace_id, company_id, relationships: { categories: [<category_id>] } })`, with the ids from the catalog result — never a name, never an id you did not read. When the user asked to *add* a category to a company that already has one, send the existing ids plus the new one; the array replaces.
   - Never retry a failed write silently. Report the exact error for that company, leave it out of `changed`, and carry on with the rest of the batch — one failure does not abandon the others.
   - Then continue with the next batch, from step 6, until the rows are exhausted or the user stops.

8. **Re-read and report the delta.** After the last batch, call `well_list_counterparties` once more with the same `workspace_id` and the same scope, and report coverage as before → after in categorized-out-of-total form. Report what the re-read actually returns, even when it disagrees with the writes you counted, and say so rather than reporting your own tally as the outcome. Then hand off.

9. **On failure, redirect instead of guessing.** A transient error on either **read** — the counterparty list or the catalog — is retried once; a second failure means you stop and do not substitute a hand-built list. This retry never applies to `well_update_company`: a retried write is a second replace-set on the same company, so surface the error instead. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows and edits the same categories there. Do not append a query parameter you have not confirmed the app reads.

## Output requirements

Return:

- One line of coverage from step 4 (categorized out of total, the biggest uncategorized counterparty, and the cap disclosure on the workspace-wide scope), then the batches with their one-line ask, then one closing line of coverage before → after.
- The hand-off block, exactly these keys, so a calling skill can read it:

  ```yaml
  workspace_id: <uuid>
  scope:
    periods:
      - { calendar_year: <YYYY>, calendar_month: <1-12> }
    uncategorized_only: <true|false>
  coverage_before:
    categorized: <integer>
    total: <integer>
  coverage_after:
    categorized: <integer>
    total: <integer>
  changed:
    - { company_id: <uuid>, name: <name>, categories: [<category_id>, …] }
  skipped_by_user: [<company_id>, …]
  resolution: updated | unchanged | read_only | unavailable
  ```

  Set `scope.periods` to the caller's months and `uncategorized_only: false` on the in-flow scope; set `periods: null` and `uncategorized_only: true` on the standalone scope. `changed` holds only the companies a write actually succeeded on, with the category ids as they now stand. `resolution` is `updated` when at least one write succeeded, `unchanged` when nothing was written — an empty list, no catalog match, or the user declining everything — `read_only` when this server's `well_update_company` has no categories relationship, and `unavailable` when `well_list_counterparties` is not in the toolset. On `unavailable`, every key except `workspace_id` and `scope` is null or empty. On `read_only`, `coverage_before` and `coverage_after` are the same figures and `changed` is empty.
- Connector coverage in plain words: the counterparties in this list are the ones Well can see, so the list is only as complete as what feeds it — bank data is what makes a counterparty's settled spend visible at all, and accounting or invoicing connections are what add the rest. Say which of those are behind the answer, and that coverage measured over a thin connector set is not the workspace's real coverage. Point at `connect-tools` when a side is missing.
- One line on what categorizing did and did not change: coverage moved, and the counterparty list is that much more complete — but `suggested_retrieval` on these rows still comes from Well's provider match, so no invoice is retrieved differently today because of this pass.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `show-missing-invoices` skill is installed: "Shall I read the missing-invoice list again, now that the coverage is higher?" — the list it produces is computed over categorized spend, so it is the read that shows what this pass unhid. Otherwise hand control back to the skill that called this one, or, when the user asked for the categorization on its own, ask whether to keep going through the remaining uncategorized rows.

Do not return:

- The rows restated in text when the counterparties card is already on screen.
- A category name that is not in the catalog, or an assignment made without the user's yes.
- A total that mixes currencies, or a `null` amount silently counted as zero.
- A capped workspace-wide list presented as the whole set.
- A claim that categorizing changed how Well retrieves invoices today.
- A counterparty list rebuilt from `companies` or `transactions` when `well_list_counterparties` was unavailable.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- If `well_list_counterparties` was absent, the answer said this Well server does not expose it yet, handed off `resolution: unavailable`, and rebuilt nothing from raw queries.
- If `well_update_company` had no `relationships.categories`, that was detected before any proposal, the run ended at `read_only`, and no confirm gate was opened.
- `workspace_id` came from `define-workspace` and was passed on every call — the workspace was not resolved here.
- Exactly one scope was sent: the caller's `periods` (at most 12) or `uncategorized_only: true`, never both.
- On the workspace-wide scope, the 50-row cap and the real `total` were both stated.
- The counterparty rows were used as returned — not re-grouped, not re-counted.
- The catalog was read once, filtered to `category_type: "company"`, and every proposed category came from it by `category_id`. No category was invented, no name was substituted for an id, and no unplaceable row got a guessed match.
- Proposals came in batches of at most 20, biggest spend first, and each batch stopped for an explicit yes before any write. No write preceded a yes; no yes was carried over from a previous batch.
- A partial or declined answer was honored exactly, with every declined company recorded in `skipped_by_user`.
- Every write was one `well_update_company` call per company, with `relationships.categories` treated as a replace-set, and no failed write was retried silently.
- Coverage was re-read after the writes and reported as the tool returned it — before → after — rather than tallied from the writes.
- Every `null` `base_total_amount` was reported as "amount unavailable" and no amounts were converted or summed across currencies.
- On a transient failure of either read the call was retried once before the workspace-link fallback; the write was never retried.
- No `well_invoke_connector_tool`, no other create / update / delete tool, and no close, lock, or posting tool was called.
- The answer says categorizing does not change today's `suggested_retrieval`, and claims no retrieval improvement it cannot support.
- The hand-off block carries every key, starting with `workspace_id`, with `scope`, `coverage_before`, `coverage_after`, `changed`, `skipped_by_user`, and `resolution` all set.
- The connector-coverage line was stated, the compliance mention (if present) appeared at most once and read naturally, and the answer ends with the next-step pointer (`show-missing-invoices` when installed, otherwise the caller or a question).

## Examples

### Example request

The fetch-missing-invoices flow calls this skill with the Acme SAS `workspace_id`, `periods: [{ calendar_year: 2026, calendar_month: 3 }]`, `purpose: "so the missing-invoice list stops hiding spend"`. The host is Claude Desktop. The tool returns 34 counterparties, 12 of them uncategorized, the largest being AWS at €4,120 over 3 transactions.

### Expected behavior

Call `well_list_counterparties({ workspace_id, periods: [{ calendar_year: 2026, calendar_month: 3 }] })` once. The card renders. Answer in one line — "**March 2026** — 22 of 34 counterparties categorized. The biggest gap is AWS, €4,120 across 3 transactions." — and do not list the rows. Read the catalog once, then propose all 12 in a single batch (under the 20 cap), biggest first: `AWS — 3 transactions, €4,120 → Cloud infrastructure`, and so on. Ask once whether to apply them and stop. On "yes", call `well_update_company` twelve times with the catalog ids, re-read the list, and report "22 → 34 of 34 categorized". Hand off `resolution: updated` with all twelve in `changed`, then offer to read the missing-invoice list again.

### Example request

"Which of my suppliers have no category?" — no period, no flow. The tool returns 50 rows with `total: 173`.

### Expected behavior

Run the standalone scope: `well_list_counterparties({ workspace_id, uncategorized_only: true })`. Say the cap out loud — "173 counterparties have no category; here are the 50 largest." — and never let the 50 read as the whole set. Propose the first 20 in one batch, biggest spend first, and stop for a yes. After that batch, offer the next 20 rather than continuing on your own. Hand off with `scope: { periods: null, uncategorized_only: true }`, `coverage_before` and `coverage_after` as the tool reported them, and `resolution: updated` once anything was written.

### Example request

The user is shown a batch of 20 and answers: "Do all of them except Stripe and Revolut — I want to think about those two."

### Expected behavior

Apply exactly the other 18: eighteen `well_update_company` calls, and no call for Stripe or Revolut. Record both `company_id`s in `skipped_by_user`, say in one line that the two were left alone at the user's request, and do not re-ask about them or fold them into a later batch. If one of the 18 writes fails, report that company's exact error, leave it out of `changed`, keep the other 17, and do not retry it silently.

### Example request

"Categorize my counterparties for last month" — `well_list_counterparties` is not in the toolset.

### Expected behavior

Say the Well server this host is connected to does not expose the counterparty list yet, and that it will not be approximated from `companies` and `transactions` because a hand-joined list groups and scopes spend differently and would misreport coverage. Emit the hand-off with `resolution: unavailable` — `workspace_id` and `scope` set, everything else null or empty — and stop. Do not read the catalog, do not open a confirm gate, and do not call `well_query_records`.

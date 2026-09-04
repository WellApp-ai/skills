---
name: assign-missing-invoices
description: Assign the settled expense transactions in one Well workspace that still have no supplier invoice for a month to a set of owners, split into unassigned, yours, and owned by others. Renders Well's owner-assignment card, one row per transaction with its owner set and a multi-select picker; picking owners replaces the set on that line, and several lines can take the same set at once. Assigning a (counterparty × month) gap to several people holds one task per owner, and one invoice resolves them all. Use when the user asks to assign missing invoices, "who owns these missing receipts", "assign these to Marie and Théo", or "assign these to me", or when a close-books flow needs expense ownership sorted. Assigns among workspace members only. Needs define-workspace, define-period, and a connected bank. Do not use to fetch or collect documents (fetch-missing-invoices, deploy-agents), to list gaps by counterparty or pick vendors to chase (show-missing-invoices), or to assign someone not in the workspace.
---

# Assign Missing Invoices with Well

## Purpose

Answer "who owns the settled expenses that still have no supplier invoice this month?" for exactly one workspace and the period the user picked, and let the user set those owners. Read Well's list of missing-invoice transactions — one row per line, each carrying its current owner set — show it in three buckets (the lines nobody owns yet, the lines already owned by the user, and the lines owned only by other people), and let the user assign a set of owners to a line, or to several lines at once, straight from the card. It sorts ownership; it never fetches, downloads, or collects a document, and it never closes a period.

**Assignment is per transaction, and the owner is a set of people.** Picking owners on a line **replaces** that line's owner set: the people you send become its owners and anyone not sent is removed. The owner lives on the transaction, so each month is assigned fresh — assigning a line this month sets nothing for next month.

**One (counterparty × month) gap, one task per owner, one shared proof.** When you assign the transactions of a (counterparty × month) gap to several people, Well holds **one task per distinct owner** for that gap, visible in each owner's own task list. Three Uber lines in March all owned by Marie become one task for Marie; the same lines owned by Marie and Théo become one task each. **One supplier invoice resolves every owner's task for that gap** — the fan-out is for accountability, not for N separate collections. Say that plainly whenever the user assigns, so nobody thinks each owner has to chase the same invoice separately.

**Volume is handled by multi-select.** To own a whole month of one vendor's spend, select every line of that vendor and assign the same set once. The card carries a checkbox per row and an "assign selected to…" action for exactly this.

**This skill assigns among people already in the workspace only** — its members, including anyone invited but not yet accepted. Assigning someone who is not in the workspace yet is a separate skill, not this one; the write refuses a person outside the workspace rather than adding them.

## When to use this skill

Use this skill when:

- The user asks to assign, split up, or divide the missing invoices for a month ("assign these expenses to someone", "who should own these missing receipts?", "split the missing invoices before close").
- The user names people to own some lines ("assign the three Uber charges to Marie and Théo", "put these on me").
- The user wants to claim their own missing invoices ("assign my expenses to me", "which of these are mine?").
- A close-books flow needs expense ownership sorted before the period is worked.

## When not to use this skill

Do not use this skill when:

- The workspace is not pinned yet — run `define-workspace` first so the pinned workspace is the one this skill's tools read.
- No period selection exists yet and the user is picking one — that is `define-period`, whose card writes the selection this skill's tool reads.
- The user wants the documents fetched or collected from the suppliers — that is `fetch-missing-invoices` and `deploy-agents`; this skill assigns owners, it collects nothing.
- The user wants every missing invoice listed by counterparty, or wants to pick which vendors to chase — that is `show-missing-invoices`; it narrows what gets fetched, this skill assigns owners to the lines.
- The user wants to assign someone who is not in the workspace yet — that is a separate skill.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required, and **passed explicitly on every call** to both tools below. Comes from `define-workspace`. If absent, reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace` first. A pin changes what an omitted `workspace_id` falls back to; it does not make the argument optional. Omitting it is the sibling-entity fallback, so pass it on the read and on every write.
- A period selection written server-side — required, but **not passed to the tool** in the normal flow: the user's click on the period card, or `define-period` on a typed month, already wrote it, and the read uses it on its own. If no selection exists yet, the read says so — run `define-period` then; never guess a period from today's date.
- A connected bank — required. The missing-invoice lines come from the bank feed. `connect-tools` reads whether a bank is connected before the period is pinned; when none is, the flow routes to `connect-bank` instead of listing an empty month.
- `purpose` — one line from the calling skill, used when a question is needed. Optional.

Every month in the selection has ended. `define-period` pins no running month, and the read refuses the whole call when the selection holds one.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_missing_invoice_owners` — the read this skill is built on. Input: `workspace_id` explicitly, as on every `well_*` call. Name the period ONE way — `{ calendar_year, calendar_month }`, `{ fiscal_year, fiscal_period }`, or `periods: [...]` for several months — or, as this flow does, pass **no period** so the server uses the selection the user's click (or `define-period`) already wrote. An error comes back when no selection exists yet, when the selected month has not ended, or for the adjustment period (13). Output: `periods_covered`, `base_currency`, `me_person_id` (the person the current user resolves to, or `null` when the token carries no person), `transactions`, the per-bucket `unassigned_count` / `assigned_to_me_count` / `assigned_to_others_count`, `row_count`, `transaction_count`, `transactions_omitted`, `sampled`, `resolved_workspace`, `success`, and `error` on failure.
  - Each entry in `transactions` is **one settled expense line still missing its supplier invoice**:
    - `transaction_id` — pass this to `well_assign_missing_invoice_owners` to set the line's owner set. Never show the raw id to the user.
    - `counterparty` — `name`, `company_id`, and `logo_url` when a provider was matched. Name the counterparty as the app renders it, with its logo where there is one.
    - `date` — the line's posting date (`YYYY-MM-DD`), or `null` when undated.
    - `description` — the bank's remittance text; may be `null`.
    - `amount`, `currency` — the line amount in its own currency, sign preserved (negative is money out); `null` when unknown.
    - `base_amount` — the same amount in `base_currency`, sign preserved; `null` when no rate covered the line's date.
    - `owners` — the line's live owner set, each `person_id` + `name`, highest-precedence first, **empty** when nobody owns the line yet.
    - `bucket` — `unassigned`, `assigned_to_me`, or `assigned_to_others`, computed against the calling person. Bucket by this, never re-derive it from `owners`.
    - `period` — the month this line belongs to.
  - **`sampled` is always true.** The rows per counterparty are a bounded sample, so `row_count` can be fewer than `transaction_count` — the window's true total — and `transactions_omitted` is the difference. This is an assignment surface, not a gap census: use it to assign owners, and quote `transactions_omitted` rather than implying the list is complete. For a period's full per-counterparty totals, that is `show-missing-invoices` (`well_list_missing_invoices`).
  - Rows come back **unassigned first**, then the caller's own, then those owned only by others.
- `well_assign_missing_invoice_owners` — the write, and the only write this skill makes. Input: `workspace_id` (explicitly, as on every `well_*` call), `transaction_ids` (one or more line ids, from the read), and `owner_person_ids` (the people who together own those lines; an **empty array clears** the owners). The write **replaces** the owner set on every named transaction with exactly `owner_person_ids`. The card calls it itself when the user picks owners from a row, or applies a set to several selected rows. Call it yourself only on the text-only path, where the user names the lines and the people in prose. Its refusals are structured on `refusal_reason`:
  - `CLOSE_OWNER_PERIOD_FROZEN` — a line whose fiscal month already closed. A frozen line refuses the **whole batch** rather than rewriting a committed close.
  - `NOT_FOUND` — a person who is not a member of the workspace, or a transaction the workspace does not own. Either refuses the batch; the person is never silently dropped.
  A refusal also carries `refusal_details` beside `error`: a frozen month rides `{ fiscalYear, fiscalPeriod }` there, and a `NOT_FOUND` names the offending id in `error` itself. Name that month or id when you surface the refusal.
  Surface a refusal in plain words and do not retry it. Output on success: `transaction_ids`, `owner_person_ids` (the set after the write, empty when cleared), `transaction_count`, and `owner_count`.
- `well_get_schema` and `well_query_records` — the text-only path only, to turn a named person into a `person_id` for `owner_person_ids`. Call `well_get_schema({ root: "people" })` once per session to learn the people fields, then `well_query_records` on `people` (with `workspace_id`) to find the person by name — the same shape `define-period` uses on `transactions`. "me" needs no lookup: it is the read's `me_person_id`. In an MCP-Apps host the card's picker resolves people itself, so these two are only for prose.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace. This skill never re-pins; re-pinning belongs to the caller.

**If `well_list_missing_invoice_owners` is not in your toolset**, the Well server this host is connected to does not expose it yet. Say exactly that, hand off `resolution: unavailable`, and stop. Do not approximate the list from raw transactions with `well_query_records` — a hand-built list carries no owner set and is not the same thing.

Never call `well_invoke_connector_tool` or any provider-specific tool. This skill reads and writes Well's own ownership; it never touches a provider.

**Composed skills.** Three atomic Well skills own the setup this skill must not inline — invoke them, don't reimplement them:

1. **Pin the workspace.** {{> define-workspace purpose="to assign the missing-invoice owners for that workspace"}}

2. **Confirm a bank is connected.** {{> connect-tools purpose="to assign the expenses missing an invoice" kinds="bank" required="bank" internalCheck=true}}
   - `bank` connected → carry on to the period step.
   - `bank` connecting → the feed is still syncing, so no settled spend has landed to assign yet. `define-period` below is called with `bankState="connected"` and would read a still-syncing feed as an empty month, so do not pin a period or read the list. Say the bank is still syncing and to try again once it finishes, and stop.
   - `bank` missing, or in error with no live feed → there is no settled spend to assign yet. Do not pin a period or read the list: hand the flow to `connect-bank` so the user can connect one, and stop. This is the connect-bank fallback the Inputs name.

3. **Pin the period.** {{> define-period purpose="to assign the expenses missing an invoice for that month" bankState="connected" mode="select" showCloseReadiness=false}}
   - Read its `has_activity`: `false` means the month holds no settled transactions at all, so there is nothing to assign for it — say so, offer `connect-bank` if the bank feed looks empty, or ask for another month, and stop. `true` or `unknown` → read the list.

The workspace is pinned by step 1, the bank confirmed by step 2, and the period written by step 3, so this skill resolves none of them itself and guesses no month.

## Workflow

Call each list or read tool once per step. The card refreshes itself — never re-call a tool just to check an assignment landed.

1. **Confirm the MCP server is configured.** If `well_*` tools are not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because the list is computed in Well from their bank data. Stop until it is there.

2. **Run the composed setup in order** — `define-workspace`, then `connect-tools` for the bank, then `define-period` (see Tooling). A missing bank sends the flow to `connect-bank` and stops here; a bank still connecting stops here with a wait message; a period with `has_activity: false` stops here too, because a month with no transactions has nothing to assign.

3. **Read the list.** Call `well_list_missing_invoice_owners({ workspace_id })` once, with no period — the server reads the period selection the user clicked.
   - An error saying no period selection exists yet → run `define-period`, then re-call. Never guess a month.
   - `success: false` naming a period that has not ended → send the flow back to `define-period` for a completed month. Never retry it.
   - Any other `success: false`, or a transient failure → retry once. A second failure → step 7.
   - `row_count: 0` → no settled expense carries a missing invoice for the month. Say plainly there is nothing to assign here, and hand off `resolution: empty`. Do not call the period closed.

4. **Report it once, and let the card take the assignment.**
   - In an MCP-Apps host the result already renders the owner-assignment card: the three buckets, each line with its owner set (avatars) and an inline multi-select people picker, plus a checkbox per row and an "assign selected to…" action. Do not restate the rows in text under it. Give one summary line — how many lines are unassigned, how many are already yours, how many are owned by others, and the total — then the sampling note from step 5, and one line telling the user they can set owners on a line from its picker, or select several lines and assign the same set at once. Add that assigning creates one task per owner and that one invoice resolves them all. Nothing else.
   - In a text-only host, list the lines in three groups — unassigned first, then already yours, then owned by others — largest amount first inside each. Give each line's counterparty, `date`, amount, and its current owner set where it has one. Then ask which lines to assign and to whom. When the user names one or more lines and one or more people already in the workspace, call `well_assign_missing_invoice_owners({ workspace_id, transaction_ids, owner_person_ids })` **once** with every named line and the shared set, and say in the same breath that each owner now holds a task for the gap and one invoice resolves them all. Resolve each named person to a `person_id` with `well_query_records` on `people` (after one `well_get_schema({ root: "people" })` per session); "me" is the read's `me_person_id` and needs no lookup. When a name matches none or several, ask rather than guess, and never assign someone who is not in the workspace.
   - A line whose `base_amount` is `null` has no rate for its currency: print **amount unavailable** for it, and never convert it yourself or add native amounts of different currencies together.

5. **State the sampling bound, every time.** Say in one line that the rows per counterparty are a bounded sample (`transactions_omitted` says how many lines the sample left out), so this is where owners get assigned, not where a period's total gaps are counted — `show-missing-invoices` carries the full per-counterparty totals. Quote `transactions_omitted` when it is above zero.

6. **End the turn on the card.** A list with rows ends its turn here — the card is on screen and the assignments are the user's to make, inline. Do not poll for them. When the user's next message names lines and people, treat it as the text-only assignment of step 4 and write it. When it asks to clear a line's owners, call the write with `workspace_id` and `owner_person_ids: []`. When it says they are done, acknowledge and hand off.

7. **On failure, redirect instead of guessing.** After a second failure, do not build the list by hand. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows the same lines there. Do not append a query parameter you have not confirmed the app reads.

8. **Hand off.** Keep the facts below so the calling flow can act on the list and the assignments without re-reading them — never printed as a block.

## Output requirements

Return:

- One line summarising the month: how many lines are unassigned, how many are already the user's, how many are owned only by others, and the total the missing invoices still cover — the sum of the MAGNITUDES of the non-null `base_amount` values (each is signed, negative is money out, so add absolute values, never net them). When `transactions_omitted` is above zero the total covers only the sampled rows, so qualify it as "across the N lines shown" (e.g. "**March 2026**: 7 expense lines have no invoice: 4 unassigned, 1 yours, 2 owned by others. €6,120 across the 7 lines shown still needs an invoice."). When several months are in the selection, name each from `periods_covered` and keep the counts and total as the totals across them. When the card is on screen this line replaces the rows.
- The sampling note from workflow step 5, stated even on an empty list.
- One line, whenever the list has rows, telling the user they can set owners on a line from its picker or select several lines and assign the same set at once, and that assigning a gap to several people creates one task per owner while one invoice resolves them all.
- Whenever an assignment is made, one plain line confirming it and its reach: the named owners now hold the gap's task each, and one supplier invoice for that gap resolves every one of them. When the write cleared a set, say the line has no owner now.
- The hand-off, kept for the calling flow and never printed: `workspace_id`; the period (`periods_covered` and the per-month coordinates); `base_currency`; `me_person_id`; the counts (`unassigned`, `assigned_to_me`, `assigned_to_others`); `row_count`, `transaction_count`, `transactions_omitted`; `total_base_amount` — the sum of the MAGNITUDES (absolute values) of the non-null `base_amount` values (each is signed, negative is money out), or null; `transactions` as returned; the assignments made this turn, each as the `transaction_ids` plus the `owner_person_ids` set (an empty set when cleared); `sampling_note`; and `resolution` — `listed`, `empty`, or `unavailable`. On `empty`, `transactions` is empty, every count is 0, and `total_base_amount` is null. On `unavailable`, only `workspace_id`, the period, and the `sampling_note` are kept. These keys are reasoning vocabulary for you and the caller, and the hand-off travels as plain conversation, not as a data block.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step on every turn that carries no assignment prompt — the empty list, the unavailable list, and the turn after the user says they are done. Hand control back to the skill that called this one, or, when the user asked for the list on its own, ask whether they want to look at another month or move on to fetching the documents with `fetch-missing-invoices` (only when it is installed).
- The whole answer stays a few plain sentences a non-technical user understands. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- The rows restated in text when the card is already on screen.
- A total that mixes currencies, or a `null` amount silently counted as zero.
- A list built from raw transactions when `well_list_missing_invoice_owners` was unavailable.
- A claim that the period is closed or fully assigned from an empty list.
- An owner set that includes a person who is not in the workspace, or the raw `transaction_id` shown to the user.
- A `row_count` reported as if it were the period's total when `transactions_omitted` is above zero.

**How this reaches the user.** A Well MCP tool that ships a widget attaches `_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key never reaches you, so you cannot tell a host that drew the assignment card from one that did not. Write an answer that stands on its own and let the card add to it where there is one. State the lines in text regardless. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- If `well_list_missing_invoice_owners` was absent, the answer said this Well server does not expose it yet, handed off `resolution: unavailable`, and computed nothing.
- The workspace came from `define-workspace`, the caller, or a session pin this conversation established — no leftover pin was reused or mentioned. Every call to both tools carried `workspace_id` explicitly.
- A missing bank sent the flow to `connect-bank` and stopped, and a bank still connecting stopped with a wait message, rather than listing an empty month. A period with `has_activity: false` stopped with "nothing to assign for this month", not an error and not a claim that the month is done.
- The read was called once, with no period argument. A no-selection error went to `define-period`; a not-ended period went to `define-period`, never retried.
- Lines were bucketed on `bucket` as returned, never re-derived from `owners`, and all three buckets were reported.
- Every assignment sent one write for all the named lines and the shared set, and made it clear that each owner holds a task for the gap and one invoice resolves them all. No assignment implied that each owner must collect the same invoice separately.
- A clear used `owner_person_ids: []`. A refusal (`CLOSE_OWNER_PERIOD_FROZEN`, `NOT_FOUND`) was surfaced in plain words and never retried. No write was attempted for a person not in the workspace.
- `row_count: 0` was reported as "nothing to assign here" and handed off `resolution: empty`, never as a closed or fully-assigned period.
- Every `null` `base_amount` was reported as "amount unavailable"; the total summed the magnitudes of the non-null base-currency amounts, and was qualified as "across the N lines shown" when `transactions_omitted` was above zero.
- The sampling note was stated, even on an empty list, and `transactions_omitted` was quoted when above zero.
- Rows were not narrated when the card was on screen.
- No `well_invoke_connector_tool` or provider-specific tool was called.
- On a transient failure the read was retried once before the workspace-link fallback.
- The hand-off facts were kept, and no yaml, JSON, or fenced code block appears anywhere in the answer.
- The turn that carries no assignment prompt ended with the next-step pointer.
- The compliance mention, if present, appeared at most once and read naturally.

## Examples

### Example request

A close-books flow calls this skill with the `workspace_id` of Acme SAS, after the user clicked March 2026 on the period card, `purpose: "to sort expense ownership before close"`. The host is Claude Desktop. The bank is connected, and the read returns four unassigned lines, one already owned by the user, and two owned by other people.

### Expected behavior

Run the composed setup: the workspace is already pinned, the bank comes back connected, and `define-period` reads the clicked March selection with `has_activity: true`. Call `well_list_missing_invoice_owners({ workspace_id })`. The card renders the three buckets, each line with its owner set and a multi-select picker, plus row checkboxes and an "assign selected to…" action. Answer in one line — "**March 2026**: 7 expense lines have no invoice: 4 unassigned, 1 yours, 2 owned by others. €6,120 across the 7 lines shown still needs an invoice." — add the sampling note, say the user can set owners on a line or select several lines and assign the same set at once, and that assigning creates one task per owner while one invoice resolves them all, and end the turn. Do not list the lines again.

### Example request

"Assign the three Uber charges to Marie and Théo" in a text-only host, after the list rendered its lines, with Marie and Théo both members of the workspace.

### Expected behavior

Match "the three Uber charges" against the listed lines and Marie and Théo against the workspace's people. Call `well_assign_missing_invoice_owners({ workspace_id, transaction_ids: [the three ids], owner_person_ids: [marie, theo] })` once. Confirm in one line: "Done. Marie and Théo each own the March Uber gap now, so each has a task for it, and one Uber invoice for March resolves both." Do not imply they have to chase the invoice separately.

### Example request

"Who owns the missing invoices for March?" but the read comes back `row_count: 0`.

### Expected behavior

Say there are no expense lines missing an invoice to assign for March 2026, add that the list is a bounded sample and `show-missing-invoices` carries a period's full per-counterparty totals, and hand off `resolution: empty`. Do not call the period closed. End on the next-step pointer.

### Example request

"Assign these to me" after the list rendered, but one of the lines belongs to a month that has already closed.

### Expected behavior

The write refuses the batch with `refusal_reason: CLOSE_OWNER_PERIOD_FROZEN`. Say plainly that one of the lines is in a month that is already closed, so Well will not rewrite its ownership, and offer to assign the lines from the open month instead. Never retry the frozen batch.

### Example request

"What am I missing?" with no bank connected in the workspace.

### Expected behavior

`connect-tools` comes back with the bank missing. Do not pin a period or read the list. Hand the flow to `connect-bank` so the user can connect a bank, and say the expenses can be assigned once the feed is in. Stop there.

## Voice
{{> voice}}

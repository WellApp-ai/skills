---
name: assign-missing-invoices
description: Assign an owner to the card-paid expenses in one Well workspace that still have no supplier invoice for a given month, split into unassigned and already assigned to you. Renders Well's owner-assignment card, one row per card with its missing-invoice transactions, current owner, and an inline people picker; picking an owner sets it on the card, covering everything that card pays going forward, not one transaction. Use when the user asks to assign missing invoices, "who owns these missing receipts", "assign these expenses to someone", or "assign my card's expenses to me", or when a close-books flow needs card expense ownership sorted. Assigns among people already in the workspace only. Needs define-workspace, define-period, and a connected bank. Do not use to fetch or collect documents (fetch-missing-invoices, deploy-agents), to list missing invoices by counterparty (show-missing-invoices), to assign someone not yet in the workspace, or for expenses paid by bank transfer.
---

# Assign Missing Invoices with Well

## Purpose

Answer "who owns the card expenses that still have no supplier invoice this month?" for exactly one workspace and the period the user picked, and let the user set those owners. Read Well's list of card instruments whose settled spend has no invoice yet, show it in two buckets — the cards nobody owns yet, and the cards already assigned to the user — and let the user assign an owner to a card straight from the card. It sorts ownership; it never fetches, downloads, or collects a document, and it never closes a period.

**Assigning an owner is a per-card, recurring choice, not a per-transaction one.** The owner lives on the card, so setting it applies to everything that card pays across every open month, not just the one transaction in view, and it keeps applying to that card going forward. Say that plainly whenever the user assigns, so nobody thinks they tagged a single line. Assigning also does not send the owner a new task: it records who owns the card and moves any invoice-chasing task Well already holds to them, and nothing more. The person sees the ownership, not a fresh to-do.

**This skill assigns among people already in the workspace only** — its members, including anyone invited but not yet accepted. Assigning someone who is not in the workspace yet is a separate skill, not this one.

## When to use this skill

Use this skill when:

- The user asks to assign, split up, or divide the missing invoices for a month ("assign these expenses to someone", "who should own these missing receipts?", "split the missing invoices before close").
- The user wants to claim their own card's missing invoices ("assign my card's expenses to me", "which of these are mine?").
- A close-books flow needs card expense ownership sorted before the period is worked.

## When not to use this skill

Do not use this skill when:

- The workspace is not pinned yet — run `define-workspace` first and pass its `workspace_id` in.
- No period selection exists yet and the user is picking one — that is `define-period`, whose card writes the selection this skill's tool reads.
- The user wants the documents fetched or collected from the suppliers — that is `fetch-missing-invoices` and `deploy-agents`; this skill assigns owners, it collects nothing.
- The user wants every missing invoice listed by counterparty, not by card, or wants to pick vendors to chase — that is `show-missing-invoices`.
- The user wants to assign someone who is not in the workspace yet — that is a separate skill.
- The user wants to assign expenses paid by bank transfer, direct debit, or a bank account rather than a card — this skill covers card-paid spend only, so those never appear here, and their absence never means the period is fully assigned.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace` first.
- A period selection written server-side — required, but **not passed to the tool**: the user's click on the period card, or `define-period` on a typed month, already wrote it, and the tool reads it on its own. If no selection exists yet, the tool says so — run `define-period` then; never guess a period from today's date.
- A connected bank — required. Card spend is what this skill assigns owners to, and it comes from the bank feed. `connect-tools` reads whether a bank is connected before the period is pinned; when none is, the flow routes to `connect-bank` instead of listing an empty month.
- `purpose` — one line from the calling skill, used when a question is needed. Optional.

Every month in the selection has ended. `define-period` pins no running month, and the read refuses the whole call when the selection holds one.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_missing_invoice_owners` — the read this skill is built on. Input: `workspace_id` explicitly, and `scope: "card"` (the only scope v1 covers; any other scope comes back empty with a "not supported yet" hint). **No period argument** — omitted, the server uses the period selection the user's click (or `define-period`) already wrote; an error comes back only when no selection exists yet. Output: `workspace_id`, `base_currency`, the period (`period_label` for one month, or `periods_covered` and `months` for several), `scope`, `me_person_id` and `me_name` (the person the current user resolves to, or `null` when the user has no person in this workspace), `rows`, `counts` (`unassigned`, `assigned_to_me`), `row_count`, `transaction_count`, `has_ambiguous`, `hints`, `success`, and `error` on failure. The people who can be assigned ride on the result for the card to draw and never reach you as text. **The list holds two buckets only** — cards with no owner, and cards already owned by the current user. A card owned by someone else is not returned at all, by design: this is the user's own worklist, not the whole team's.
- Each entry in `rows` is **one card**, already scoped by the server:
  - `payment_means_id`, `card_label` — the card the expenses were paid with, named as the app renders it (never a raw id to the user).
  - `bucket` — `unassigned` or `assigned_to_me`. Bucket by this, which follows the owner the write sets; never re-derive a bucket from the transactions.
  - `close_assignee_person_id`, `close_assignee_name` — the card's current owner, carried on the row itself so the name shows even for an owner no longer listed among the assignable people. `null` on an `unassigned` card.
  - `tx_count`, `base_total_amount` — how many of the card's settled transactions have no invoice, and their total in `base_currency` (or `null` when a currency has no rate).
  - `transactions` — the card's own missing-invoice lines, capped by the server, each with `id`, `date`, `description`, `amount`, `currency`, `base_amount`. `transactions_omitted` says how many the cap left out — quote that number rather than implying the list is complete.
  - `ambiguous` — `true` when Well cannot tell this card apart from another (their last four digits collide), so it cannot take an owner safely. An ambiguous card is shown but cannot be assigned; say why in plain words and never attempt the write on it.
- `well_assign_missing_invoice_owner` — the write, and the only write this skill makes. Input: `workspace_id`, `payment_means_id` (the card), and `person_id` (the owner, or `null` to clear the owner). The card calls it itself when the user picks an owner from its inline picker. Call it yourself only on the text-only path, where the user names the card and the person in prose. It is a wide write: it sets the owner on the card, which flows to every open-month transaction that card pays and to any invoice-chasing task Well already holds for them. It fails on an ambiguous card, and on a person who is not in the workspace — surface either in plain words rather than retrying. `destructiveHint` is set: it changes ownership across many lines, so it is never a probe.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace. This skill never re-pins; re-pinning belongs to the caller.

**If `well_list_missing_invoice_owners` is not in your toolset**, the Well server this host is connected to does not expose it yet. Say exactly that, hand off `resolution: unavailable`, and stop. Do not approximate the list from raw transactions with `well_query_records` — a hand-built list carries no owner and is not the same thing.

Never call `well_invoke_connector_tool` or any provider-specific tool. This skill reads and writes Well's own ownership; it never touches a provider.

**Composed skills.** Three atomic Well skills own the setup this skill must not inline — invoke them, don't reimplement them:

1. **Pin the workspace.** {{> define-workspace purpose="to assign the missing-invoice owners for that workspace"}}

2. **Confirm a bank is connected.** {{> connect-tools purpose="to assign the card expenses missing an invoice" kinds="bank" required="bank" internalCheck=true}}
   - `bank` connected or connecting → carry on to the period step.
   - `bank` missing, or in error with no live feed → there is no card spend to assign yet. Do not pin a period or read the list: hand the flow to `connect-bank` so the user can connect one, and stop. This is the connect-bank fallback the Inputs name.

3. **Pin the period.** {{> define-period purpose="to assign the card expenses missing an invoice for that month" bankState="connected" mode="select" showCloseReadiness=false}}
   - Read its `has_activity`: `false` means the month holds no settled transactions at all, so there is nothing to assign for it — say so, offer `connect-bank` if the bank feed looks empty, or ask for another month, and stop. `true` or `unknown` → read the list.

The workspace is pinned by step 1, the bank confirmed by step 2, and the period written by step 3, so this skill resolves none of them itself and guesses no month.

## Workflow

Call each list or read tool once per step. The card refreshes itself — never re-call a tool just to check an assignment landed.

1. **Confirm the MCP server is configured.** If `well_*` tools are not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because the list is computed in Well from their bank data. Stop until it is there.

2. **Run the composed setup in order** — `define-workspace`, then `connect-tools` for the bank, then `define-period` (see Tooling). A missing bank sends the flow to `connect-bank` and stops here; a period with `has_activity: false` stops here too, because a month with no transactions has nothing to assign.

3. **Read the list.** Call `well_list_missing_invoice_owners({ workspace_id, scope: "card" })` once — the server reads the period selection the user clicked.
   - An error saying no period selection exists yet → run `define-period`, then re-call. Never guess a month.
   - `success: false` naming a period that has not ended → send the flow back to `define-period` for a completed month. Never retry it.
   - Any other `success: false`, or a transient failure → retry once. A second failure → step 7.
   - `row_count: 0` → no card carries a missing invoice for the month. This is **not** the same as the period being closed or fully assigned: bank-transfer and account-paid spend can still be missing invoices, and this list never showed them. Say plainly that there are no card expenses to assign here, name that bound, and hand off `resolution: empty`. Never say the period is done.

4. **Report it once, and let the card take the assignment.**
   - In an MCP-Apps host the result already renders the owner-assignment card: the two buckets, each card with its owner (or an assign control), its transaction table, and an inline people picker. Do not restate the rows in text under it. Give one summary line — how many cards are unassigned and how many are already yours, and the total — then the coverage line from step 5, and one line telling the user they can assign an owner to a card from the card, and that doing so covers everything that card pays, not just one transaction. Nothing else.
   - In a text-only host, list the cards in two groups — unassigned first, then already yours — largest amount first inside each. Give each card's label, `tx_count`, amount, and its current owner where it has one. Say which are ambiguous and cannot be assigned. Then ask which card to assign and to whom. When the user names a card and a person already in the workspace, call `well_assign_missing_invoice_owner({ workspace_id, payment_means_id, person_id })`, and say in the same breath that it now owns everything that card pays going forward. Resolve the person against the workspace's people; when the name matches none or several, ask rather than guess, and never assign someone who is not in the workspace.
   - A card whose `base_total_amount` is `null` has no rate for its currency: print **amount unavailable** for it, and never convert it yourself or add native amounts of different currencies together.

5. **State the coverage, every time.** Say in one line that this list covers **card-paid** expenses missing an invoice only, so spend paid by bank transfer or direct debit is not here and its absence does not mean the month is fully assigned. Add any `hints` the tool returned. When `has_ambiguous` is true, add that one or more cards cannot be assigned because Well cannot tell them apart, and name them.

6. **End the turn on the card.** A list with rows ends its turn here — the card is on screen and the assignments are the user's to make, inline. Do not poll for them. When the user's next message names a card and a person, treat it as the text-only assignment of step 4 and write it. When it asks to clear an owner, call the write with `person_id: null`. When it says they are done, acknowledge and hand off.

7. **On failure, redirect instead of guessing.** After a second failure, do not build the list by hand. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows the same cards there. Do not append a query parameter you have not confirmed the app reads.

8. **Hand off.** Keep the facts below so the calling flow can act on the list and the assignments without re-reading them — never printed as a block.

## Output requirements

Return:

- One line summarising the month: the `period_label`, how many cards are unassigned and how many are already the user's, and the total (e.g. "**March 2026**: 4 cards with missing invoices are unassigned and 1 is already yours. €6,120 of card spend still needs an invoice."). When several months are in the selection, name each from `periods_covered` and keep the counts and total as the totals across them. When the card is on screen this line replaces the rows.
- The coverage line from workflow step 5, stated even on an empty list.
- One line, whenever the list has rows, telling the user they can assign an owner to a card from the card, and that assigning covers everything that card pays going forward, not one transaction. In a text-only host, the question of step 4 takes its place.
- Whenever an assignment is made, one plain line confirming it and its reach: the person now owns that card's spend, across every open month and going forward, and Well moved any invoice-chasing task it already held to them. Do not imply the person was sent a new task.
- The hand-off, kept for the calling flow and never printed: `workspace_id`; the period (`period_label` for one month, `periods_covered` and the per-month `months` totals for several); `base_currency`; `me_person_id`; `counts` (`unassigned`, `assigned_to_me`); `total_base_amount` — the sum of the non-null `base_total_amount` values, or null; `rows` as returned; the assignments made this turn, each as `payment_means_id` plus the `person_id` set (or null when cleared); `coverage_note` — card-paid only, plus ambiguity when present; and `resolution` — `listed`, `empty`, or `unavailable`. On `empty`, `rows` is empty, every count is 0, and `total_base_amount` is null. On `unavailable`, only `workspace_id`, the period, and the `coverage_note` are kept. These keys are reasoning vocabulary for you and the caller, and the hand-off travels as plain conversation, not as a data block.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step on every turn that carries no assignment prompt — the empty list, the unavailable list, and the turn after the user says they are done. Hand control back to the skill that called this one, or, when the user asked for the list on its own, ask whether they want to look at another month or move on to fetching the documents with `fetch-missing-invoices` (only when it is installed).
- The whole answer stays a few plain sentences a non-technical user understands. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- The rows restated in text when the card is already on screen.
- A total that mixes currencies, or a `null` amount silently counted as zero.
- A list built from raw transactions when `well_list_missing_invoice_owners` was unavailable.
- A claim that the period is closed or fully assigned from an empty card list — bank-transfer spend is not covered here.
- An owner set for a person who is not in the workspace, or an assignment attempted on an ambiguous card.
- Cards owned by someone other than the current user — the list holds two buckets only, and the tool already excludes the rest.

**How this reaches the user.** A Well MCP tool that ships a widget attaches `_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key never reaches you, so you cannot tell a host that drew the assignment card from one that did not. Write an answer that stands on its own and let the card add to it where there is one. State the cards in text regardless. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- If `well_list_missing_invoice_owners` was absent, the answer said this Well server does not expose it yet, handed off `resolution: unavailable`, and computed nothing.
- `workspace_id` came from `define-workspace`, the caller, or a session pin this conversation established — no leftover pin was reused or mentioned.
- A missing bank sent the flow to `connect-bank` and stopped, rather than listing an empty month. A period with `has_activity: false` stopped with "nothing to assign for this month", not an error and not a claim that the month is done.
- The read was called once, with `scope: "card"` and no period argument. A no-selection error went to `define-period`; a not-ended period went to `define-period`, never retried.
- Cards were bucketed on `bucket` as returned, never re-derived from the transactions, and no card owned by someone else was shown or invented.
- Every assignment made it clear the owner covers the whole card, across open months and going forward, and that no new task was sent to the person. No assignment implied a per-transaction scope.
- An ambiguous card was named as unassignable and never written to. A write was never attempted for a person not in the workspace.
- `row_count: 0` was reported as "no card expenses to assign here", with the card-paid-only bound stated, and never as a closed or fully-assigned period.
- Every `null` `base_total_amount` was reported as "amount unavailable"; the total summed only non-null base-currency amounts.
- The card-paid-only coverage line was stated, even on an empty list, with any `hints` and any ambiguity.
- Rows were not narrated when the card was on screen.
- No `well_invoke_connector_tool` or provider-specific tool was called.
- On a transient failure the read was retried once before the workspace-link fallback.
- The hand-off facts were kept, and no yaml, JSON, or fenced code block appears anywhere in the answer.
- The turn that carries no assignment prompt ended with the next-step pointer.
- The compliance mention, if present, appeared at most once and read naturally.

## Examples

### Example request

A close-books flow calls this skill with the `workspace_id` of Acme SAS, after the user clicked March 2026 on the period card, `purpose: "to sort card expense ownership before close"`. The host is Claude Desktop. The bank is connected, and the read returns four unassigned cards and one already owned by the user.

### Expected behavior

Run the composed setup: the workspace is already pinned, the bank comes back connected, and `define-period` reads the clicked March selection with `has_activity: true`. Call `well_list_missing_invoice_owners({ workspace_id, scope: "card" })`. The card renders the two buckets with their transaction tables and inline pickers. Answer in one line — "**March 2026**: 4 cards with missing invoices are unassigned and 1 is already yours. €6,120 of card spend still needs an invoice." — add the card-paid-only coverage line, say the user can assign an owner to a card from the card and that it covers everything that card pays going forward, and end the turn. Do not list the cards again.

### Example request

"Assign the Amex to Marie" in a text-only host, after the list rendered its cards, with Marie already a member of the workspace.

### Expected behavior

Match "the Amex" against the listed cards and Marie against the workspace's people. Call `well_assign_missing_invoice_owner({ workspace_id, payment_means_id, person_id })`. Confirm in one line: "Done. Marie now owns the Amex, so every open-month expense on that card, and any invoice Well is already chasing for it, is hers going forward." Do not say Marie was sent a new task.

### Example request

"Who owns the missing invoices for March?" but the read comes back `row_count: 0` while the month holds plenty of bank-transfer spend.

### Expected behavior

Say there are no card expenses missing an invoice to assign for March 2026, and that this view covers card-paid spend only, so expenses paid by bank transfer are not here and this does not mean the month is fully assigned. Hand off `resolution: empty`. Do not call the period closed. End on the next-step pointer.

### Example request

"Assign these to me" after the list rendered, but one of the cards is flagged `ambiguous: true`.

### Expected behavior

Assign the cards that can take an owner to the user, and for the ambiguous one, say plainly that Well cannot tell it apart from another card with the same last four digits, so it cannot be assigned here, and point the user to Well to resolve it. Never attempt the write on the ambiguous card.

### Example request

"What am I missing?" with no bank connected in the workspace.

### Expected behavior

`connect-tools` comes back with the bank missing. Do not pin a period or read the list. Hand the flow to `connect-bank` so the user can connect a bank, and say the card expenses can be assigned once the feed is in. Stop there.

## Voice
{{> voice}}

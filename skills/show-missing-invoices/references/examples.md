# Examples

Worked examples of this skill's behavior across the read paths, the text-only fallback, the
missing-tool degrade, both dropped-groups outcomes, a multi-month read, and a
provider-grouped hand-off.

### Example request

The fetch-missing-invoices flow calls this skill with the `workspace_id` of Acme SAS, after
the user clicked March 2026 on the period card, `purpose: "to decide which suppliers Well
should chase"`. The host is Claude Desktop.

### Expected behavior

Call `well_list_missing_invoices({ workspace_id })` — no periods argument; the server reads
the clicked selection. The card renders the twelve counterparty rows with their badges,
their checkboxes and their transaction tables. Answer in one line — "**March 2026** holds
12 suppliers with no invoice: 7 Well can fetch, 3 need a connection, 2 need an upload.
€18,430 of settled spend." — add the coverage line, ask the user to tick the vendors to
chase and click Continue, and end the turn. Do not list the twelve rows again. The next
message is one of the card's two Continue prefills — the one naming the connect step first
when the pick includes a vendor Well carries a connector for: the click already wrote the
picked vendors, so acknowledge it in half a sentence, follow the order the message asks
for, and hand off `resolution: listed` with `selection_state: written`, the picked
`company_id` / `matched_connector_service_id` pairs, and `agent_candidates` grouped by
provider.

### Example request

"What am I missing?" with no period selection written yet — the tool answers that no
selection exists.

### Expected behavior

Do not guess a month. Run `define-period`: its picker renders and waits for the click (or
resolves a typed month and writes it). Once the selection is written, re-call
`well_list_missing_invoices({ workspace_id })` and report as usual.

### Example request

"What am I missing for March?" in a text-only host, the selection written by
`define-period`. Three rows come back; one has `base_total_amount: null`.

### Expected behavior

List the three counterparties grouped by mode, saying how each gap can be closed in plain
words from its `mode`. Print "amount unavailable" for the null row and state the total
covers the two rows that have an amount. Say the gaps cover categorized expense
transactions only, then ask which vendors to chase — no card can take the tick here. The
user answers "the first two": match those two names against the rows you listed and call
`well_switch_workspace({ workspace_id, counterparties })` with their `company_id` and
`matched_connector_service_id` values, then hand off with `resolution: listed`,
`selection_state: written`, and `total_base_amount` set to the sum of those two.

### Example request

"Which invoices am I missing for last month?" — `well_list_missing_invoices` is not in the
toolset.

### Expected behavior

Say the Well server this host is connected to does not expose the missing-invoices tool
yet, and that the answer cannot be approximated from raw transactions without changing what
is being measured. Hand off `resolution: unavailable` and stop. Do not call
`well_query_records`. This turn carries no tick request, so end it on the next-step
pointer: hand control back to the calling flow, or ask what the user wants to do next when
they asked for the list on its own.

### Example request

The tool returns `row_count: 0`, `transaction_count: 5`, `dropped_groups: {
bank_internal: 1, unknown: 0, unnamed_company: 1 }` — the five transactions sit in the two
dropped groups, so no row carries them.

### Expected behavior

One group is a real gap this list cannot show, so do not call the period complete. "No
supplier invoice can be listed for **March 2026**, but Well could not attribute one group
of the period's categorized spend to a named counterparty. This list shows none of it and
cannot chase it. The period also holds bank operations with no counterparty, and no
supplier can invoice those. Spend that is not categorized yet cannot appear here either."
Hand off `resolution: empty` with zeroed counts, an empty `selection` and
`selection_state: none` (and `workspace_id` still set). The `unknown` and `unnamed_company`
groups carry no resolvable company, so there is no counterparty row to label: do not offer
`categorize-counterparties` here. End on the next-step pointer instead — hand control back
to the calling flow, or ask which month to look at next when the user asked for the list on
its own. Nothing is on the card to tick, so ask for no click.

### Example request

The tool returns `row_count: 0`, `transaction_count: 0`, `dropped_groups: {
bank_internal: 0, unknown: 0, unnamed_company: 0 }`.

### Expected behavior

Every counter is 0, so the period is complete and the wording says so. "No missing supplier
invoices for **March 2026**. Every categorized expense from a supplier has its invoice.
Spend that is not categorized yet cannot appear here." Quantify no examined-transaction
figure: the result carries none. Hand off `resolution: empty` exactly as above, and ask for
no click. End on the next-step pointer — hand control back to the calling flow, or ask
which month to look at next.

### Example request

The user clicked February 2026 and March 2026 on the period card, so the selection holds
two months. The result carries `periods_requested: 2`, `periods_covered` naming both
months, `months` with each month's own totals, and no `period_label` on the envelope.

### Expected behavior

Name both months in the summary line — "**February 2026 and March 2026** hold 19 suppliers
with no invoice: 11 Well can fetch, 5 need a connection, 3 need an upload. €31,200 of
settled spend across both months." — and quote no single label, because the result carries
none. Leave the rows to the card: a supplier with a gap in both months holds one row per
month, each tagged with its own `period_label`, and the two are never merged. Hand off
`periods_covered` and the `months` totals in place of the single-month fields, so the
preview step is not told one month.

### Example request

The list holds five `mode: agent` rows — three matched to Amazon, two with
`matched_provider_name: null` — and one of the Amazon rows carries a `proof_task_id` with
`acquisition_status: waiting`.

### Expected behavior

Report the five. The Amazon row's task id with `waiting` means Well already records that
gap and nothing is fetching it, so say it is already recorded and do not ask for that
document again — never say a collection is under way on `waiting`. Group
`agent_candidates` into `provider_name: "Amazon"` (three counterparties) and
`provider_name: "unknown"` (two), each counterparty carrying its `company_id` and each
group its summed `tx_count` and amount, so the pick and the preview both travel on
identifiers.

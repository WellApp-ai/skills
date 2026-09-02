# Examples

### Example request

A month-end flow calls connect-tools with `workspace_id` of Acme SAS, `kinds: [bank, accounting, invoicing]`, `purpose: "to fetch the invoices missing for March"`. The catalog comes back with a Qonto row — `direction: input`, `data_domains: ["bank"]`, `connection_status: enabled`, `last_successful_sync_at` set — and no other connected row.

### Expected behavior

One unscoped `well_list_connectors` call renders the card. Say: "Bank: connected to Qonto. Accounting and invoicing: not connected yet; I need them to know which March invoices are missing. Connect them from the card if you like, then click Continue." and end the turn. The user connects Pennylane from the card, clicks Continue, and sends the prefilled "Continue": that is the acknowledgment — move on to the bank step in one sentence, with no verification call. The hand-off keeps the coverage the card was read with; Pennylane's fresh connection shows up in the later steps' own reads.

### Example request

Everything is already connected — bank, accounting, and invoicing all green.

### Expected behavior

The card still renders and the step still stops. Say "Bank, accounting, and invoicing are all connected. That's everything this job needs. Click Continue when you're ready." and end the turn. Move on only when the "Continue" prefill (or a typed continue) arrives. Do not skip ahead because the coverage is green.

### Example request

"Is my accounting tool connected?"

### Expected behavior

The question names one kind, so scope to it: `well_list_connectors({ workspace_id, kind: "accounting" })` — one scoped call, not a full catalog read. The card then names the accounting scope itself. "Accounting: error, Pennylane is authenticated but its last sync failed; reconnect it from the card." Standalone ask, nothing follows: stop after the coverage line, no acknowledgment needed. Hand off with `coverage: none` (no requested kind is delivering data) and the reconnect link; do not touch bank or invoicing.

### Example request

"Is Pennylane connected?" — the catalog holds a Pennylane row with `connection_status: enabled` but `direction: output` and `data_domains: null`.

### Expected behavior

That row is a push-back destination, not the accounting data source. Report "Accounting: missing. Pennylane is set up for exporting entries, but its accounting sync is not connected", find the `input` row for Pennylane in the same result (or with `q: "pennylane"`), and let the card carry its install link. Do not report accounting as connected.

### Example request

The missing-invoice flow's vendor pick names three counterparties, and one of them carries a `matched_connector_service_id` for Stripe.

### Expected behavior

Make one call: `well_list_connectors({ workspace_id, from_selection: true })`, with no `kind` and no `q` beside it — the tool rejects that combination. The result reports `scope: "picked_vendors"`, and the card titles itself from that field and lists Stripe pre-checked. Say: "Stripe is one of the vendors you picked, and Well can pull its invoices from a connector instead of a browser agent. Connect it from the card, then click Continue." and end the turn. Report no kind as missing off this card — it lists the picked vendors' tools, not the workspace's coverage — and point forward with "Next: what Well would fetch for those vendors."

### Example request

`cash-position` calls connect-tools with `workspace_id` of Acme SAS, `kinds: [bank]`, `required: [bank]`, `mode: internal_check`, `purpose: "to total the cash across connected accounts"`. The user asked "what's my cash position?" — they asked for a figure, not for a connect step.

### Expected behavior

One `well_list_connectors` call, scoped to `kind: bank`. In an MCP-Apps host the picker card draws — that is what a UI tool does, and it is the cost of reading coverage inline. Do **not** add a closing line, do **not** ask for Continue, and do **not** call `well_wait_for_selection`. Hand `coverage: full` back to `cash-position` in the same turn and let it total the accounts, so the user gets their cash position in one round-trip instead of three. Had the read come back `coverage: none`, hand that back too and let `cash-position` decide — an `internal_check` never converts itself into a stop.

### Example request

The card ends the turn, and the user's next message is "skip invoicing, keep going" while the caller passed `required: []`.

### Expected behavior

Record invoicing under `skipped_by_user`, treat the message as the acknowledgment, and continue in one sentence. Had `required` contained `invoicing`, say the flow cannot continue without it and stop, keeping the hand-off for the caller.

### Example request

A text-only host — nothing renders a card. The user asks to connect their accounting tool, so the call is `well_list_connectors({ workspace_id, kind: "accounting" })`. The result holds nine installable rows and carries `install_all_url`, with `install_all_omitted` empty.

### Expected behavior

Name at most three connectors — the `is_preselected` rows first — and give those three their own `install_url` links. Do not offer this call's `install_all_url`: it installs all nine, and the answer describes three. An offer the reader cannot read is not an offer. Say the three are the tools Well recommends here and that the accounting catalog holds more, so nothing about the answer implies it covers the domain. Had `install_all_url` come back null — an unscoped read, or the whole bank domain — the named rows' own links would be the offer just the same, and no batch link would be mentioned at all.

### Example request

The same text-only host, after the user ticked Stripe, Shopify and Pennylane on the missing-invoices card. The call is `well_list_connectors({ workspace_id, from_selection: true })`. The result lists exactly those three, all installable, and carries `install_all_url` with `install_all_omitted` empty.

### Expected behavior

Name all three — Stripe, Shopify and Pennylane — and hand the one `install_all_url`. Every connector that link installs is a connector the answer names and the user chose, which is what earns the batch link. Do not print the rows' own `install_url` links beside it. Name any `install_all_omitted` row separately with its own `install_url`, because the batch link does not reach it. A `q` search earns the link the same way: where the user names one accounting tool, `well_list_connectors({ workspace_id, kind: "accounting", q: "Pennylane" })` returns the rows the answer names, and that call's `install_all_url` installs nothing wider.

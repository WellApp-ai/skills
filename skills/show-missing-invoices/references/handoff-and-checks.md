# Hand-off fields and the verification checklist

The full definition of every hand-off key this skill carries back to the calling flow, and
the pre-hand-off checklist to verify against before finishing. Output requirements carries
the condensed key list needed to compose the hand-off; this file carries every field's
exact meaning and every edge case.

## Hand-off fields

Keep these facts so the next step can act on the list, and on the user's pick, without
re-reading either — never printed as a block:

- `workspace_id` — always the workspace this list was read for, from the tool response or
  from the `define-workspace` hand-off when no call was made.
- The period — the single-month fields (`calendar_year`, `calendar_month`, `fiscal_year`,
  `fiscal_period`, `period_label`) when the result carried them, and `periods_covered` plus
  `periods_requested` and the per-month `months` totals when it did not, so the next step
  is never told one month for a list that spans several.
- `base_currency`; `transaction_count`; the `rows` exactly as returned; the `counts` per
  mode (`agent`, `upload`, `connect`); `total_base_amount` — the sum of the non-null
  `base_total_amount` values, or null.
- `agent_candidates` — the `mode: agent` rows grouped by `matched_provider_name`, rows with
  no matched provider under `"unknown"`, each group carrying its counterparties
  (`company_id`, name, `tx_count`, `base_total_amount`), its summed `tx_count`, its summed
  non-null amount, and the `matched_connector_service_id` its rows share.
- `selection` — the vendors the user picked, each as its `company_id` plus its
  `matched_connector_service_id` or null, in the order the pick came in.
- `selection_state` — `written` (the Continue click, a wait-read whose
  `selection.workspace_id` matched this workspace, or your own text-only write recorded
  it), `pending` (the card is on screen and nothing is picked yet, or the only pick read
  was made in a different workspace than the pinned one and so counts as no pick), or
  `none` (an empty or unavailable list has nothing to pick).
- The `coverage_note` — one line, categorized expense transactions only, plus
  `dropped_groups` when non-zero.
- `resolution` — `listed`, `empty`, or `unavailable`. On `empty`, `rows` is empty, every
  count is 0, `total_base_amount` is null, and `selection` is empty. On `unavailable`, only
  `workspace_id`, the period, and the `coverage_note` are kept.

`selection` carries identifiers only — a later step routes on `company_id` and
`matched_connector_service_id`, never on a vendor's display name. These keys are reasoning
vocabulary for you and the calling flow, and the hand-off travels as plain conversation,
not as a data block. `selection` and `selection_state` are this skill's own record of the
pick it saw; the step that follows reads the pick the card wrote into the session.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp`
  instead of a tool error.
- If `well_list_missing_invoices` was absent, the answer said this Well server does not
  expose it yet, handed off `resolution: unavailable`, and computed nothing.
- `workspace_id` came from `define-workspace`, the caller, or a session pin this
  conversation established — no leftover pin from another conversation was reused or
  mentioned, and no workspace question was asked in text.
- The tool was called once, with no periods argument — the server-held selection decided
  the period. A single-month result had its `period_label` quoted from the result; a
  multi-month result named every month from `periods_covered`, quoted no single label, and
  invented no range label. A no-selection error sent the flow to `define-period`, not to a
  guessed month.
- Each row was attributed by its own month tag (`calendar_year`, `calendar_month`,
  `period_label`); two rows for one counterparty in two months were left as two rows, and
  the hand-off carried `periods_covered` rather than one month whenever the list spanned
  several.
- The counterparty rows were used as returned and not re-grouped or re-counted; the card's
  own transaction tables were left to the card.
- A list with rows ended its turn on the card with one line asking for the tick and the
  Continue click. The Continue prefill was taken at its word with no verification call, and
  the order it named — the connect step first, or the deploy step straight away — is the
  order the answer followed; any other message got one `well_wait_for_selection({ kind:
  "counterparties", timeout_s: 10 })` call, and the wait tool was never called before the
  card existed. A `selected` answer was taken as the pick only when its
  `selection.workspace_id` was the workspace this list was read for; a pick read for a
  different workspace than the pinned one was treated as no pick — the turn ended asking
  for the tick on the card now on screen, and `selection_state: pending` went to the
  hand-off.
- The pick travels as identifiers — `company_id` plus `matched_connector_service_id` — and
  no display name was written into the selection. A text-only pick was resolved against the
  rows that were listed, a row with a null `company_id` was left out of it, and the write
  carried one entry per company: a counterparty listed in two months was written once, and
  the list stayed within 200 entries.
- Every `null` `base_total_amount` was reported as "amount unavailable"; the total summed
  only non-null base-currency amounts and disclosed how many rows it excluded.
- The categorized-only coverage line was stated, even on an empty list, with each non-zero
  `dropped_groups` counter and any `hints`. The line quantified no examined-transaction
  figure, and `transaction_count` was never presented as the transactions Well read.
- An empty row list was resolved on `dropped_groups`: the period was called complete only
  when `unknown` plus `unnamed_company` was 0. Above 0, the answer named the unattributed
  group count, said this list can neither show nor chase it, and claimed nothing over it.
- Rows were not narrated when the card was on screen.
- No `well_invoke_connector_tool` or provider-specific tool was called.
- On a transient failure the call was retried once before the workspace-link fallback. A
  refusal naming a period that has not ended was sent back to `define-period` instead —
  never retried, and never resolved with the workspace link.
- The connector-coverage line was stated: which of bank, accounting, or invoicing data is
  behind the answer, and — when `connect` rows exist — that connecting those providers
  turns manual uploads into gaps Well can close itself.
- The hand-off facts were kept — `workspace_id`, the period, `counts`, `agent_candidates`,
  `selection`, `selection_state`, `coverage_note`, and `resolution` — and no yaml, JSON, or
  fenced code block appears anywhere in the answer.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- The turn that carries no tick request ends with the next-step pointer — the empty list,
  the unavailable list, and the turn after the pick is written (`connect-tools` before
  `deploy-agents` when the pick names a connector Well carries, otherwise the caller or a
  question). The card turn ends on the tick request instead. `categorize-counterparties`
  was offered only over rows that carry no category, and never as a way to surface more
  gaps.

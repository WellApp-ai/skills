# Quality Checklist

The full pre-answer verification gate. Run it before finishing every turn.

Before finishing, verify:

- No write tool was called: no `well_invoke_connector_tool`, no `well_create_*`, no
  `well_update_*`, no `well_delete_*`, no connector action.
- `workspace_id` came from the caller, or from a session pin this conversation established —
  no leftover pin from another conversation was reused or mentioned. The period came from
  the server-held selection (the preview call carried no periods argument), and neither was
  resolved or guessed here.
- The preview came from `well_preview_invoice_fetch` when it exists, and from the
  `show-missing-invoices` hand-off's `agent_candidates` when it does not — never from a
  guess about which providers a workspace uses.
- The pick was in hand before anything was previewed: the `show-missing-invoices`
  hand-off's `selection`, matched on `company_id`, with `selection_state: pending` — or a
  pick belonging to an earlier gap-list card — sent back to `show-missing-invoices` for a
  fresh click, and `selection_state: none` resolved as an empty or unavailable list rather
  than asked for again.
- The scope line came from `scoped_to_selected_counterparties`: the picked vendors only, for
  the months the pick was made against, when it was true; the whole period when it was
  absent and no hand-off narrowed the result.
- A preview spanning several months named every month from `periods_covered`, quoted no
  single `period_label` (the result carries none then) and composed no range label, kept one
  agent per portal across the months, and handed off `periods_covered` and the per-month
  `months` counts.
- One line per agent, in the user's language, each saying nothing has started, written
  whatever the host drew and never expanded into the row detail the card carries.
- The turn ended on the card with one line asking the user to confirm the vendors and
  deploy — or, where no card was drawn, carrying the collect link exactly as `collect_url`
  returned it, its required `workspace` parameter intact, or the workspace link — with no
  parameter added, edited or removed on either.
- A counterparty the preview listed under a portal and in `connect_rows` was reported once,
  as one gap with two routes, and the two lists were never added together.
- On a previewed run the upload line and the connect line are both present, even at zero,
  each counted in counterparty rows — one per month — or in a distinct-vendor count the
  answer names as such, plus an `unmatched_rows` line of its own when that count is non-zero.
  On `nothing_to_do` none appear.
- No agent was built for the `"unknown"` group; its transactions were counted as
  `unmatched_rows` instead, never folded into `upload_rows`, and a period holding only that
  group resolved `previewed` rather than `nothing_to_do`.
- The categorized-only coverage line was stated, with the tool's `hints` when the tool ran,
  and it carried no offer to categorize the vendors — that skill labels companies and widens
  no plan bounded by transaction categorization.
- Every agent carries a `provider_id` — from the tool, or from the hand-off's
  `matched_connector_service_id` — and null only when neither source has one.
- The answer contains one plain sentence stating that nothing has started here, and naming
  the browser extension as where a collection starts once the user acts on the collect page.
- No launch, result, yield, or ETA is claimed anywhere, and a vendor whose `provider_id` is
  null — or one the tool listed in `collect_url_omits` — was reported as one the link cannot
  take rather than one an agent will fetch.
- Counts are described as transactions missing an invoice, not as invoices already found.
- Amounts appear only when set, and never mix currencies.
- After a connection or an upload landed, the preview was re-derived in the same turn.
- On a transient tool failure the call was retried once, then the hand-off was used, then
  the workspace link — in that order.
- The hand-off facts were kept — `workspace_id`, the period, `run_mode: preview`,
  `nothing_launched: true`, `selection`, the agents with their `provider_id` and `domain`,
  `collect_url`, `scoped_to_selected_counterparties`, `coverage_note`, and `resolution` — and
  no yaml, JSON, or fenced code block appears anywhere in the answer.
- A run with neither the preview tool nor a hand-off handed off `resolution: unavailable`,
  never `nothing_to_do`, and claimed no counts.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the hand-back to the caller, and any request to run the collection
  was answered with the card's Deploy action or the collect link plus the fact that the
  extension runs it once the user starts it there, never with a run from the session or a
  finished run claimed anywhere.

# Tool contracts and row fields

The full input/output contract for the four `well_*` tools this skill uses, and the full
field catalog for a `well_list_missing_invoices` row. The Tooling section carries the
condensed version needed to call each tool correctly; this file carries every field name,
every edge case, and the exact wording rules attached to them.

## `well_list_missing_invoices`

Input: `workspace_id` explicitly, as on every `well_*` call, and **no periods argument** —
omitted, the server uses the period selection the user's click (or `define-period`) already
wrote. An error comes back only when no selection exists yet: run `define-period`, then
re-call. Pass the months explicitly only on an older server that holds no session
selection, and then take them from `define-period`'s hand-off (`periods`), never from
today's date — the degrade path, never the default.

Output: `workspace_id`, `base_currency`, `periods_requested`, `periods_covered`, `months`,
`transaction_count`, `rows`, `row_count`, `group_count`, `dropped_groups`, `hints`,
`success`, and `error` on failure.

**The five single-month fields — `calendar_year`, `calendar_month`, `fiscal_year`,
`fiscal_period` and `period_label` — come back only when the selection held exactly one
month.** With several months they are absent from the envelope: `periods_requested` says
how many months the call read, `periods_covered` names them (each as `calendar_year`,
`calendar_month`, `period_label`, oldest first), and `months` carries each month's own
`calendar_year`, `calendar_month`, `period_label`, `fiscal_year`, `fiscal_period`,
`row_count`, `transaction_count`, `group_count` and `dropped_groups`. `periods_requested`,
`periods_covered` and `months` come back on every success, one month included; the
top-level `transaction_count`, `row_count`, `group_count` and `dropped_groups` are always
totals across every month read.

**`well_list_missing_invoices`' `transaction_count` counts the transactions that are
MISSING their invoice** — the gap total behind the rows. It is not a count of the
transactions Well examined, and it is no denominator. `well_list_periods` carries a field
of the same name that counts every transaction a month holds; name the owning tool
whenever you refer to either, because the two never mean the same thing.

## Row fields

Each entry in `rows` is **one counterparty in one month**, already grouped by the server —
never re-aggregate it. Every row carries its own month — `calendar_year`, `calendar_month`
and `period_label` — and `rows` runs oldest month first. So a counterparty with a gap in
two of the selected months holds two rows: attribute each row by its own tag, and never
merge the two.

- `id`, `company_id`, `name` — the counterparty; `tx_count` — how many settled
  transactions of theirs have no invoice; `base_total_amount` — their total in
  `base_currency`, or `null`. `company_id` is the identifier the selection travels on; a
  row whose `company_id` is `null` cannot be picked, so it is reported and left out of the
  selection.
- `transactions` — the row's own lines, in ledger order, capped by the server, each with
  `id`, `date`, `description`, `category`, `category_key`, `amount`, `currency` and
  `base_amount`. The card lists them under the counterparty. `amount` is signed and stays
  in the transaction's own currency, so never add those across currencies. `base_amount`
  is the same line in `base_currency`, still signed, and the magnitudes of those DO sum to
  `base_total_amount` — it is the one per-line figure a text-only host can state beside the
  row total. Branch on `category_key`, never on the `category` label.
  `transactions_omitted` says how many the cap left out — quote that number instead of
  implying the list is complete.
- `mode` — how the gap can be closed: `agent` (Well can collect it from the provider),
  `connect` (connect the named provider first), `upload` (the user supplies the document).
  It is the ONE route the card suggests.
- `available_modes` — every route the row offers: `agent` and `upload` on every row, plus
  `connect` when Well carries a connector for the matched provider. Two or three entries,
  never one. The card renders one badge per entry, so `mode` names the suggestion and this
  names the choice.
- `suggested_action` — the backend's raw routing decision for that row, BEFORE the
  downgrade rules, as one of `connect_provider`, `chrome_extension_fetch` and
  `manual_upload`. It can disagree with `mode`, which is that decision after the
  downgrades. Word every user-facing sentence off `mode`, and never print this enum value
  to the user.
- `matched_provider_name`, `matched_provider_has_blueprint`, `matched_connector_service_id`
  — the provider behind an `agent` or `connect` row; `matched_provider_name` is `null` when
  Well could not match one.
- `proof_task_id` — the close-proof task bound to that row, `null` until one is minted. It
  records that Well already tracks the gap; it reports no fetch. When it is set, say the
  row is already recorded and do not ask for the same document again — read
  `acquisition_status` for where the row actually stands.
- `acquisition_status`, `refusal_reason` — where the row stands, and why Well will not act
  on it. `waiting` means no document has arrived and nothing is fetching; `processing`
  means a document arrived and the pipeline has not settled it; `mapped` means the gap is
  closed; `refused` means the document landed and the bridge declined to link it. Report
  progress only on `processing` and closure only on `mapped`, and never say a fetch is
  under way on `waiting`. Report both fields verbatim when they explain an inactionable
  row; never reword them into a cause you inferred.

## `dropped_groups`

`dropped_groups` (`bank_internal`, `unknown`, `unnamed_company`) counts the **groups** the
server could not turn into a row — one count per group, never a transaction count. The
three counters do not mean the same thing, so never sum them into one figure:

- `bank_internal` — party-less bank operations. No supplier can invoice them, so they are
  not gaps.
- `unknown` — the server resolved no counterparty for the spend.
- `unnamed_company` — the counterparty carries no usable name or key, so the card cannot
  render it.

`bank_internal` and `unknown` are SINGLETON buckets: one month's operations of either kind
are one group however many they are, and a read over several months counts the months that
held any. So never quote either counter as a quantity of operations.

`unknown` and `unnamed_company` are categorized expense spend that still has no supplier
invoice. **They are gaps**, and this list can neither show them nor chase them. Disclose
every non-zero counter, name `unknown` plus `unnamed_company` as spend this list leaves
out, and claim nothing over it.

## `well_switch_workspace`

The selection write, and the only write this skill is part of. The card calls it on its
**Continue** click with `workspace_id`, `counterparties` — an array of `{ company_id,
matched_connector_service_id }`, at most 200 entries, ONE per company, copied off the rows
— and `counterparty_periods`, the months the card listed, which bound the pick to those
months. Call it yourself only on the text-only path of Workflow step 4, where the user
names the vendors in prose. A counterparties call scopes the selection to the workspace it
is dispatched to and leaves the pin alone, so it never re-pins; re-pinning between
workspaces belongs to the caller, and a switch to another workspace clears the selection.

## `well_wait_for_selection`

`well_wait_for_selection({ kind: "counterparties", timeout_s? })` is the click read, legal
only after THIS conversation rendered the missing-invoices card. Its one job is reading the
pick when the user's next message is not one of the card's two Continue prefills. Never
before the card exists, and never as a probe. An already-made pick returns instantly as `{
status: "selected", selection: { workspace_id, periods, counterparties }, already_set: true
}`, where `selection.periods` names the months the pick was listed for — empty when the
pick names none and so covers every month read; with nothing picked yet it waits briefly
(default 10 seconds) and returns `{ status: "no_selection_yet" }` — a normal result, not an
error. `selection.workspace_id` is the workspace the pick was made in, and it is what says
whether the pick is yours: compare it with the pinned workspace before you act on the pick.
A pick read for a different workspace than the pinned one is not this pass's pick — treat
it as no pick and ask for the tick on the card now on screen. The fetch step never honours
a pick from another workspace, so handing one on previews something other than the vendors
the user ticked.

## `well_list_workspaces`

For resync only: its `session` block carries the pinned workspace, the queue a
multi-workspace caller walks, and `selected_counterparties` once a pick is written. This
skill never re-pins; re-pinning belongs to the caller.

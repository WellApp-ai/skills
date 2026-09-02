# Gap-list and preview — full reporting rules and hand-off fields

This file holds the exact wording rules, the counting conventions, and the complete
hand-off field lists for the categorization read (step 4), the gap-list card (step 5),
and the preview output (step 7). `SKILL.md` keeps the decision logic (the thresholds
that stop or continue each step) and the turn boundaries; this file is where you check
the precise phrasing a rule demands or the exact field to read or pass forward.

## Step 4 — categorization: reading and stating the condition

Read the condition off `uncategorized_count` and nothing else. **The gap list cannot
decide this step**: `well_list_missing_invoices` reports no categorization figure at
all, and its `transaction_count` counts the transactions missing their invoice, so
`transaction_count: 0` means nothing is missing rather than that anything is thin. The
tool's other scope, `uncategorized_only: true`, sweeps the WHOLE workspace and carries
no period figures — this flow works in the selected months, so it is not the scope to
call here.

`uncategorized_count` counts ROWS, and a row is one counterparty per month, so a
selection holding several months repeats a counterparty once per month. Quote it as
rows, and never as a count of companies.

**Where step 3 was skipped, state the bank fact yourself** in the coverage line: every
selected month holds bank transactions, which is what the skip was decided on. Never
pass `bank_state: connected` for it. A count above 0 is settled history, not a live
connector state, and step 3 read no connector. Left unsaid, the brick's own caveat
reports the connected side as unconfirmed on the one run where this flow just read a
positive count for every selected month.

The coverage line, when the card renders, names how many rows carry no category out of
`row_count` — naming that denominator for what it is, the counterparties whose invoices
the selected months are still missing, never the months' counterparties and never the
workspace's — plus the biggest of them by amount, then one line saying this changes what
Well knows about the vendors and not which invoices are missing.

**Categorizing a counterparty changes neither the gap list nor the route offered for
it.** The gap list is bounded by TRANSACTION categorization — the expense nature carried
on each transaction — while this step writes the counterparty company's INDUSTRY
labels, which are a separate field. So this step unhides no gap, and nothing after it
has to be re-read. Never tell the user that categorizing will surface more missing
invoices, and never call the gap list thin.

The step runs BEFORE the gap list because nothing it writes changes that list. Its read
scopes itself to the counterparties whose invoices the selected months are still
missing, so it needs neither step 5's rows nor the pick — and a card rendered after the
pick would sit between the user's tick and the steps that read it.

## Step 5 — the gap-list card's exact wording rules

The result renders the missing-invoices card — the counterparty rows with their Agent /
Connect / Upload badges in one flat list, each row carrying a checkbox and its own
transaction table, and the footer offering **Keep for later** and **Continue**. Say one
line only — counterparties per mode and the total — never restating rows the card shows
and never re-grouping them. Rules: rows come grouped by the server, never re-aggregate;
a null `base_total_amount` is "amount unavailable", never converted or summed; the only
total sums non-null base-currency amounts and says how many rows it excludes; quote
`period_label` from the result when the selection held one month, and name every month
from `periods_covered` when it held several — the result then carries no single label,
so never quote one month for the whole list and never compose a range label; disclose
every non-zero `dropped_groups` counter as the **groups** the server could not turn into
a row, and keep the three apart, and quote no number for `bank_internal` or for
`unknown` — each is a singleton bucket per month, so each counts the months that held
any rather than the operations or the counterparties inside them. Only `unnamed_company`
is keyed per company, so it is the one of the three to quote as a quantity.
`bank_internal` holds party-less bank operations with no supplier to invoice them, while
`unknown` and `unnamed_company` hold categorized expense spend still missing a supplier
invoice that this card can neither list nor chase; always state the coverage line — the
list covers the period's **categorized** expense transactions only. **The result carries
no count of the transactions Well examined**, so state that bound in words and quantify
it with nothing: `well_list_missing_invoices`' `transaction_count` counts the
transactions missing their invoice, not the transactions read.

**What the pick hands on.** The card's **Continue** click writes the ticked vendors into
the session — each as its `company_id` plus its `matched_connector_service_id`,
identifiers only, never a display name — and prefills one of two messages, chosen by
whether any picked vendor carries a `matched_connector_service_id`. **That message names
the order steps 6 and 7 run in, and this flow follows it**: the connect step first, or
the deploy step straight away. A row whose `acquisition_status` is `processing` has a
document in the pipeline; a row carrying a `proof_task_id` with `waiting` is recorded
and nothing is fetching it. Either way say it is already recorded and do not ask for it
again — never say a collection is under way.

**Keep**: the period as the result expressed it — the single-month fields when the
selection held one month, `periods_covered` plus the per-month `months` totals when it
held several, so the later steps are never told one month for a list that spans several
— `counts` per mode, `total_base_amount`, `transaction_count`, `agent_candidates` (the
`mode: agent` rows grouped by `matched_provider_name`, unmatched under `"unknown"`, each
group with its counterparties — `company_id`, name, `tx_count` and `base_total_amount` —
its summed `tx_count`, its summed non-null amount, and the shared
`matched_connector_service_id` as `provider_id`), each counterparty's `company_id` —
carried by the gap list's rows and by the `agent_candidates` groups alike — `selection`
(the picked `company_id` / `matched_connector_service_id` pairs), `selection_state`
(`written`, `pending`, or `none`), `coverage_note`, and `resolution` — `listed`, `empty`,
or `unavailable`.

## Step 7 — the preview output, line by line

Output, in the user's language (read from the conversation, not the workspace country)
— the lines `deploy-agents` writes when it ran, and the lines to write yourself on the
fallback path:

- One line per agent, each saying nothing has started — French `Agent prêt pour <provider> — N factures (rien n'est encore lancé)`, English `Agent ready for <provider> — N invoices (nothing started yet)`. Write these lines whatever the host drew: you cannot tell a host that drew the preview card from one that did not (see **How this reaches the user** in `SKILL.md`), so this output never branches on a card being on screen. Keep each line to the provider and its count, and never expand one into the row detail the card carries. Above five agents, name the five largest by invoice count and close with one line covering the rest — a length rule, not a host rule.
- **A vendor Well holds a connector for is on BOTH lists, and it is one gap with two routes.** Such a counterparty is in `connect_rows` AND under its portal's agent bucket, where its entry reads `suggested_route: "connect"` and the bucket's `connect_routed_counterparties` counts it. Say that connecting is the route to take and that the agent run stays available if the connector does not work for them; never present the same vendor as two separate gaps, and never add the two lists together.
- **Every count keeps the unit the field states.** In `counts`, `agents` counts PORTALS, `agent_tx` counts TRANSACTIONS, and `upload` and `connect` count COUNTERPARTIES. They are not summable with each other, so never report a single "total gaps" figure built from them.
- The upload line and the connect line, always both, even at zero. **A vendor the collect link cannot take gets its own line, saying the link starts nothing for it** — either its `provider_id` is null, so no link can address it, or the tool named it in `collect_url_omits`, because one collect link carries at most 25 portals. A null `domain` is only a missing label and costs the vendor nothing.
- The coverage line: the plan covers categorized expense transactions only.
- The scope line: the picked vendors only when `scoped_to_selected_counterparties` was true, the whole period when the flag was absent and there was nothing to narrow the result from.
- One line on what the link does: confirm the vendors on the card and click Deploy, which opens the collect link. Where no card was drawn, give the tool's `collect_url`, or the workspace link when the preview carried none, and add no query parameter of your own.
- **The nothing-started sentence, on its own**: no agent has started here, no task is queued and no browser session is open — the collect page hands the picked portals to the Well browser extension, whose side panel reports the runs. Counts are transactions missing an invoice, never a yield, a result, or an ETA.

# Preview Tool Contract

The full field-by-field shape of `well_preview_invoice_fetch`'s output, what
`scoped_to_selected_counterparties` means for the answer, the `collect_url` addressing
rules, and the one shape difference the tool-absent path carries.

## `well_preview_invoice_fetch` output shape

Input: `workspace_id` explicitly, as on every `well_*` call, and **no periods argument** —
omitted, the server uses the period selection the user's click (or `define-period`) already
wrote. An error comes back only when no selection exists yet: run `define-period`, then
re-call. A period pair is passed explicitly only on an older server that holds no session
selection — the degrade path, never the default.

Output: the period fields — `periods_requested`, `periods_covered` (each month as
`calendar_year`, `calendar_month` and `period_label`, oldest first) and `months` (each
month's own `counts`) on every success, plus `calendar_year`, `calendar_month`,
`fiscal_year`, `fiscal_period` and `period_label` **only when the selection held exactly one
month**, so a selection spanning several months carries no single label to quote —
`agents` (each with `provider_name`, `provider_id` or null, `domain` — the provider's bare
host, e.g. `aws.amazon.com` — and `url` — the portal address the catalog holds, which
`domain` reduces to its host; both are null when unmatched or absent from the catalog, and
both are display only — `logo_url`, `counterparties` — each `name`, its own month
(`calendar_year`, `calendar_month`, `period_label`), `tx_count`, `base_total_amount` and
`suggested_route` — `connect_routed_counterparties`, `tx_count`, and `base_total_amount` or
null), `upload_rows` and `connect_rows` (their rows carry the same month tag), `counts`,
`collect_url`, `collect_url_omits` — the portals a large window pushed past that link's
ceiling, present only when some were left out — `scoped_to_selected_counterparties` with
`selection_scope` beside it, `base_currency` — the currency every `base_total_amount` is
stated in — `mode: "preview"`, `nothing_launched: true`, and `hints`. It is a read: it
computes the plan and returns it. Carry `provider_id`, `domain`,
`scoped_to_selected_counterparties` and `hints` through to your hand-off — `provider_id` is
the identifier the link names and a run routes on, `domain` only labels the portal on
screen, `scoped_to_selected_counterparties` tells a scoped result from a period-wide one,
and `hints` says how far the categorized data reaches.

## Scoped vs period-wide results

`scoped_to_selected_counterparties` is the field that says what the result covers. It is
present and `true` only when the pick bounded at least one month of the window, and then
every route covers the picked vendors only for the months the pick was made against — a
month of the window the pick never covered is covered in full. It is absent when the server
held no pick for this workspace, and absent too when the pick covers none of the months
read; either way the result covers every gap of the months read. Read it before you describe
the scope; never infer the scope from the row count. `selection_scope` comes back beside it
and says how large the truncation is — `rows_dropped_by_filter` of the
`row_count_before_filter` counterparty rows in the months read are not covered — so quote
those two numbers rather than presenting the counts as the whole period.

When `scoped_to_selected_counterparties` is true, narrow nothing further: the server already
filtered every route to the recorded pick. One agent covers one supplier portal however many
months the selection held, so never split or restate an agent per month — each counterparty
under it names its own month, `months` carries each month's own route counts, and a
selection spanning several months is named from `periods_covered` rather than under one
label the result does not carry.

When the flag is absent, the result covers the whole period, not the pick — either the
server held no pick for this workspace, or the pick covers none of the months read, and both
leave every gap of those months in the routes. Narrow it from the `show-missing-invoices`
hand-off's `agent_candidates` instead: those carry a `company_id` per counterparty, which the
tool's rows do not, so they are the only identifier-matched way to reach the picked set. With
no hand-off to narrow from, report the plan as covering the whole period and say so; never
present a period-wide result as the pick.

## The collect link

`collect_url` is the one link to hand the user. Its shape is
`<well-app-base-url>/collect?workspace=<workspace_id>&providers=<entry>,<entry>,…`, and each
entry is `<provider_id>[~<name>[~<url>]]`. The `provider_id` is required and is the only
field that decides which portal runs; the page refuses an entry that does not start with
one. The name and the host label the row and nothing more. Give it exactly as returned:
never build a link yourself and never add or edit a parameter. The `workspace` parameter is
required, and it gates WHO may act on the link: the link is forwardable, so the page starts
nothing until the reader is signed in to Well as a member of that workspace, and it refuses
every other reader. It does NOT choose where the invoices land — the extension files into
whichever workspace it is signed in to — so never tell the user the link picks the
destination. It is null when no previewed agent carries a `provider_id`. One link names at
most 25 portals; `collect_url_omits` names the ones it left out, and no run reaches them
from that link. The page needs the Well browser extension installed and signed in, and it
says so on screen when it is not.

An agent whose `provider_id` is null cannot be named on the collect link, so no run can
carry it. Report it as a vendor the link cannot take, and never promise it will be fetched.
A null `domain` is a missing label and nothing more: that agent still travels on its id. The
portals the tool lists in `collect_url_omits` are outside the link too — report them the
same way, as vendors this link does not cover.

## A connector match still runs as an agent

A vendor Well holds a connector for stays an agent candidate. Such a counterparty is in
`connect_rows` AND under its portal's agent bucket, where its entry reads
`suggested_route: "connect"` and the bucket's `connect_routed_counterparties` counts it.
Connecting is the route to suggest, and the agent run stays available when the connector
does not suit the user. Report one gap with two routes, never two gaps, and never add the
two lists together. A connector match that carries no `provider_id` stays a connect row
only: no link can address that portal. The rows the tool-absent path derives carry no
`suggested_route` — `agent_candidates` groups the agent rows alone — so this only applies to
a preview the tool returned.

## Tool-absent derivation

When the preview tool is absent, no call to it is needed at all. Derive the same preview
from the `show-missing-invoices` hand-off's `agent_candidates`, which carry the provider and
its counterparties, narrowed to the picked `company_id` values, matched on that id — never
on a counterparty or provider name. One candidate group is one agent: its `provider_name`,
its `counterparties` (each with `tx_count` and `base_total_amount`), its `tx_count`, and its
`base_total_amount`. Carry no amount at all rather than a partial one when a counterparty in
the group has none. For `upload_rows` and `connect_rows`, count the hand-off's `rows` whose
`mode` is `upload` or `connect` and whose `company_id` is in the pick. The hand-off's
`counts.upload` and `counts.connect` are period-wide numbers with no counterparty behind
them: they cannot be narrowed, so never quote one under a pick-scoped answer. That path
carries no `provider_id` and no `collect_url`, and a link cannot be built without the ids:
give the workspace link instead and say the collection starts from the app's collect page,
which this run cannot address.

## Resync fallback

`well_list_workspaces`' `session` block carries `selected_counterparties` (the pick, with
the workspace its company ids belong to; null until one is recorded), `pinned_workspace_id`
and `workspace_queue`. Read it only to resync — for a click the `show-missing-invoices`
hand-off missed, or for a run that reaches this skill with no hand-off at all — never as a
first move when the hand-off already carries the pick.

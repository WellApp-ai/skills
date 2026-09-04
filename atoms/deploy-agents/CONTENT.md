---
name: deploy-agents
description: Preview what Well would fetch for the vendors the user picked — the agents, the manual uploads, the providers to connect — then hand those portals to the Well app. Nothing collects anything here. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "to close March's missing invoices"
---

Call each list or read tool once per step. The cards refresh themselves — never re-call one to check progress. Nothing in this step launches anything.

No `well_*` tool at all → the Well MCP server has not been added to this host: say to add it at `https://api.wellapp.ai/v1/mcp`, then fall back to the hand-off if you have one. `well_*` present but `well_preview_invoice_fetch` absent → the tool does not exist in this host yet, which is normal today: say nothing about it and take the tool-absent path. A run derived entirely from the `show-missing-invoices` hand-off calls nothing, so neither check blocks it.

The workspace is already pinned — pass its `workspace_id` on any call you make, never re-pin, never guess a month; if the preview tool answers that no period selection exists yet, run `define-period` and re-call.

The pick comes from the `show-missing-invoices` hand-off, never from a vendor's name. `selection_state: written` → preview its `selection`. `pending` → run `show-missing-invoices` so its card takes the click, and preview nothing meanwhile. `none` → resolve `nothing_to_do` on an empty list and `unavailable` on an unavailable one, and ask for no tick no card can take. Read `well_list_workspaces`' `session.selected_counterparties` only as a resync — a click the hand-off missed, or a run reaching here with no hand-off — never as a first move; null, or naming a workspace other than the pinned one, reads as `pending`.

Build the preview, and keep it to the pick:
- Tool present → call `well_preview_invoice_fetch({ workspace_id })`, **no periods argument** (the server reads the clicked selection), and use its `agents`, `upload_rows`, `connect_rows`, `counts`, `scoped_to_selected_counterparties` and `collect_url` as they come, `provider_id`, `domain` and `url` included. Recompute nothing, re-sort nothing.
- `scoped_to_selected_counterparties: true` → the server already bounded the result to the pick, for the months the pick was made against. Say the plan covers the picked vendors only for those months, and that a month of the window the pick never covered is covered in full. Narrow nothing further. One agent covers one portal however many months the selection held — never split an agent per month; `months` carries each month's route counts, and a multi-month selection is named from `periods_covered`.
- Flag absent → the result covers the whole period, not the pick. Narrow it from the hand-off's `agent_candidates`, which carry a `company_id` per counterparty where the tool's rows do not. With no hand-off, report the plan as covering the whole period and say so; never present a period-wide result as the pick.
- Tool absent → reshape the hand-off's `agent_candidates`, already grouped by provider, keeping the counterparties whose `company_id` is in the pick — matched on that id, never on a name. One group is one agent: `provider_name`, its counterparties with their `tx_count` and `base_total_amount`, its summed `tx_count` and summed amount, carrying no amount at all rather than a partial one. Take `upload_rows` and `connect_rows` from the hand-off's `rows` whose `mode` is `upload` or `connect` and whose `company_id` is in the pick; its `counts.upload` and `counts.connect` are period-wide with no counterparty behind them, so they cannot be narrowed and are never quoted under a pick-scoped answer. This path carries no `provider_id` and no `collect_url`.
- The `"unknown"` group is never an agent, whichever path produced it: no agent dispatches against a provider that was never identified. Keep it out of `agents` and carry its `tx_count` as `unmatched_rows`, counted apart from `upload_rows`.
- Every agent carries a structured provider identifier: the tool's `provider_id`, otherwise the `matched_connector_service_id` shared by that group's rows, otherwise null. Never make a later step identify a provider by name alone.
- A pick yielding no agent — every picked vendor an upload or a connect row — keeps `agents` empty, still states the lines below, and resolves `previewed`. `nothing_to_do` is only a pick with nothing on any of the three routes; a pick holding only an `"unknown"` group is not one.

Say what would run: one line per agent, in the language of the conversation and not of the workspace country, naming the provider, the count, and that nothing has started (`Agent ready for Shopify: 3 invoices (nothing started yet)`). Above five agents, name the five largest by invoice count and close with one line for the rest. The count counts **transactions with no invoice attached** — what an agent would look for, not what it would find; say that once, never as a yield. Print an amount only where `base_total_amount` is set, never `null`, never summed across currencies not already in the base currency.

Then one line on what the link does, and end the turn. The card's footer carries the mechanics — **Deploy** opens the collect link for the vendors still ticked and waits, disabled, while none is ticked; **Continue** stands in its place only when no vendor in this read is named on a collect link; **Keep for later** opens nothing — so ask the user to confirm the vendors and deploy{{#if purpose}} "{{purpose}}"{{/if}}, and leave the labels to the card. Where no card is drawn, give the tool's `collect_url` when the tool ran and the workspace link otherwise, and say the collect page hands the picked portals to the Well browser extension once the user starts them there. Append no query parameter of your own. An agent whose `provider_id` is null cannot be named on the collect link, and neither can a portal listed in `collect_url_omits`: report both as vendors the link cannot take, never as ones that will be fetched. A null `domain` is only a missing label — that agent still travels on its id.

Then the rows an agent does not fetch on its own — two lines always, a third when it applies. One for `upload_rows`, which no agent can fetch; one for `connect_rows`, whose route is connecting a service; both appear at zero. Both are counterparty rows, one per month, so a vendor missing an invoice in two of the months read counts once for each: say that unit, or count the distinct vendors and say so. A counterparty the tool also listed under a portal keeps its agent run and is counted once, not on both lines. The third line, only when `unmatched_rows` is non-zero: Well matched no provider for those transactions, so no agent covers them — its own line and its own count, since folding it into `upload_rows` misreports both. On `nothing_to_do` none of these lines applies. If the user connects a provider or uploads a document and says so, re-derive the preview in the same turn and restate it; a change of mind about the vendors goes back to `show-missing-invoices` for a fresh pick.

Restate how far the preview reaches, one line, every time: these counts cover the period's **categorized** expense transactions only, so spend not categorized yet cannot appear in the plan. Use the hand-off's `coverage_note` where you have it and the tool's `hints` where the tool ran. Never offer `categorize-counterparties` as widening this bound: it writes the vendor company's industry labels, while this plan is bounded by TRANSACTION categorization.

State plainly what has and has not started, as a sentence of its own: no agent has started here, no task is queued, no browser session is open — then where a collection does start, the collect page handing the picked portals to the Well browser extension, whose side panel reports the runs. Say it even where the card names agents, and never claim a launch, a result, a downloaded invoice, a success rate, or an ETA. When the user says the link opened, say the page names the portals they picked and waits for them to start it. The page can also refuse the reader before showing any portal — no Well session, an account that is not a member of the workspace the link names, or an unreachable Well — and none of those is a failed collection: nothing ran, so report a link the reader could not open, and send a non-member to an account that is a member rather than to a second link.

This step reads or derives and never writes: no `well_invoke_connector_tool`, no `well_create_*` / `well_update_*` / `well_delete_*`, no connector action, no `well_switch_workspace` re-pin. It reads nothing else either — never `well_get_entity`, `well_get_schema`, or `well_query_records`; the preview tool and `well_list_workspaces`' `session` block are the only reads. On a transient preview failure, retry once; a second failure falls back to the hand-off; with neither, invent no plan — give the user `<well-app-base-url>/workspaces/<workspace_id>` and resolve `unavailable`.

Emit the hand-off, kept for the caller and never printed as a block:

```yaml
workspace_id: <uuid>
period: <the single-month fields when the result carried them, else periods_covered + the per-month months counts>
run_mode: preview
nothing_launched: true
selection: [{ company_id, matched_connector_service_id or null }, …]
agents: [{ provider_name, provider_id, domain or null, tx_count, base_total_amount or null,
           counterparties: [{ name, tx_count, base_total_amount }] }, …]
upload_rows: <int>
connect_rows: <int>
unmatched_rows: <int>          # the "unknown" group's transactions, which no agent covers
collect_url: <the collect link when the tool returned one, else null>
scoped_to_selected_counterparties: <true when the tool scoped the result to the pick; absent otherwise>
coverage_note: <categorized expense transactions only, plus the tool's hints when it ran>
resolution: previewed | nothing_to_do | unavailable
```

`run_mode` is always `preview`, under its own key because `mode` upstream means a row's `agent | connect | upload` badge. `provider_id` is what the collect link names and a run dispatches on; `domain` only labels the portal on screen.

Verify before moving on: the preview call carried `workspace_id` and no periods argument; the plan was kept to the pick — bounded by the server's own flag, or narrowed from `agent_candidates` on `company_id` — and no period-wide result was presented as the pick; no agent was split per month; the `"unknown"` group stayed out of `agents` and its transactions were counted as `unmatched_rows`, apart from `upload_rows`; every agent carries a `provider_id` from the tool or the hand-off, and one with none — or one in `collect_url_omits` — was reported as a vendor the link cannot take; period-wide `counts.upload` / `counts.connect` were never quoted under a pick-scoped answer; the counts were called transactions with no invoice attached, never a yield; the categorized-only bound was stated; one plain sentence said nothing has started, no task is queued and no browser session is open, and named the collect page and the extension as where a collection does start; no write tool ran, and no `well_get_entity`, `well_get_schema`, or `well_query_records` call was made.

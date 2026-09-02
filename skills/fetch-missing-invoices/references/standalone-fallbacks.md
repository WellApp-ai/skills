# Standalone fallbacks — when a composed brick is absent

Five steps of the fetch-missing-invoices flow — 2, 4, 5, 6, and 7 — each carry an inline
fallback for the case where this skill is installed on its own and the brick that step
normally runs is missing from the toolset. A fallback is what this flow does when the
brick is missing, never a second source of truth beside it: when the brick IS installed,
none of this file applies — run the brick as `SKILL.md` describes.

## Step 2 fallback — no `define-period`

**Inline fallback, for a standalone install with no `define-period`.** Resolve a hint yourself (a bare "March" is the most recent March that has ended; "last month" the last complete month; "this month" refused the way a future month is refused, with the last complete month named instead; "Q1" / several months = one multi-month selection, oldest first; a future month is refused) and write it with `well_switch_workspace({ periods: [{ calendar_year, calendar_month }, …] })`; with no hint, call `well_list_periods({ workspace_id })` and keep each selected month's `bank_transaction_count` from the rows it returns, exactly as the brick would hand them back, or — when that tool is absent too — propose the last complete month in one line and write the confirmed answer the same way. Then derive the fiscal coordinate for each selected month, exactly this, mirroring the Well platform:

```
fiscal_period = ((calendar_month - fiscal_year_start_month + 12) % 12) + 1
fiscal_year   = calendar_month >= fiscal_year_start_month ? calendar_year : calendar_year - 1
```

(1-based months; `fiscal_year_start_month` null → assume 1 and say so; period 13 cannot exist.)

No activity probe: the flow never reads `transactions` — step 5's gap list is the activity check. **Every month this step pins has ended.** The period-scoped reads of steps 4, 5 and 7 refuse the whole call when the selection holds a month that is still running, so a running month reads not at all rather than partially. Narrate the selection in one line with its fiscal coordinates.

## Step 4 fallback — no `categorize-counterparties`

**Inline fallback, for a standalone install with no `categorize-counterparties`:** call `well_list_counterparties({ workspace_id, periods })` yourself, and know that **the card is the categorization tool** — a pick saves immediately through the card's own write, and the card shows its own saves; never propose a batch the user did not ask for. Either way, say one coverage line (how many rows carry no category out of `row_count`, naming that denominator for what it is — the counterparties whose invoices the selected months are still missing, never the months' counterparties and never the workspace's — plus the biggest of them by amount), one line saying this changes what Well knows about the vendors and not which invoices are missing, one card line (picking a category in a row saves it immediately; say "continue" when done), and **end the turn** — no proposal list, no per-row commentary, no enrichment read, no "shall I apply". Propose categories only when the user explicitly asks. Then, in that turn alone, take the `well_query_records` carve-out named under Tooling — `root: "categories"`, `whereClause: { category_type: { _eq: "company" } }` — and work from that catalog plus the rows' names and domains, with no other tool call. Leave out any row you cannot place from its name and domain, and say so rather than guessing. On a yes, write with `well_update_company({ workspace_id, company_id, category_ids })`, one call per confirmed company, `category_ids` being catalog ids as a replace-set.

## Step 5 fallback — no `show-missing-invoices`

**Inline fallback, for a standalone install with no `show-missing-invoices`.** Make that one `well_list_missing_invoices({ workspace_id })` call yourself, and take the pick yourself where no card was drawn: ask which vendors to chase, resolve the names against the rows you listed, and write it with `well_switch_workspace({ workspace_id, counterparties })` — the one occasion rule 9 allows here — leaving out any row whose `company_id` is null. The reporting rules in the `gap-list-and-preview-reporting` reference are this step's own either way.

## Step 6 fallback — no `connect-tools`

**Inline fallback, for a standalone install with no `connect-tools`.** Call `well_list_connectors({ workspace_id, from_selection: true })` yourself, and pass NOTHING else that scopes — `from_selection` cannot travel with `kind` or `q`, and the call is refused if it does. An empty list means the session holds no pick for this workspace, or none of the picked counterparties matched a connector: say the step has nothing to connect and go to step 7, and never widen the call to the catalog to fill the card. Resolve the next message as an ack, exactly like step 3 — the card's "Continue" prefill or a typed continue moves the flow on, and step 7's own read is the verification. **Do not call `well_wait_for_selection({ kind: "connect_ack" })` here.** This step takes no wait-read at all: its ack is the card's "Continue" prefill or a typed continue, and nothing else. `connect-tools` owns the reason. On any other message, ask once for the Continue click and end the turn.

## Step 7 fallback — no `deploy-agents`

**Inline fallback, for a standalone install with no `deploy-agents`.** Call `well_preview_invoice_fetch({ workspace_id })` yourself — **no periods argument** — and use the result's `agents`, `upload_rows`, `connect_rows`, `provider_id`, `domain`, `collect_url`, `collect_url_omits`, `scoped_to_selected_counterparties` and `hints` as returned. One agent covers one supplier portal however many months the selection held, so never split an agent per month; each counterparty under it names its own month, and `months` carries each month's own route counts. **`scoped_to_selected_counterparties: true` means the result IS the picked set** — the server filtered every route to the recorded pick, and naming a period does not widen it — so say the plan covers the picked vendors only. Without that flag the server held no pick, so the result covers the whole period: narrow it from step 5's rows and `agent_candidates` groups, which carry a `company_id` per counterparty where this tool's own counterparties do not, and say the plan covers the whole period when there is nothing to narrow from. When the tool is absent too: derive the preview from step 5's `agent_candidates`, keeping only the counterparties whose `company_id` is in the pick, matched on that id, never on a name — one group being one agent — and call nothing. No agents, uploads, or connects → `nothing_to_do`: say the picked vendors have nothing to fetch.

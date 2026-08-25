---
name: deploy-agents
requires: [define-workspace, define-period, show-missing-invoices]
description: Preview what Well would fetch for the vendors the user picked — which agents would run, over which counterparties and transactions, which rows need a manual upload, and which providers need connecting — then hand those vendors to the Well app. Nothing collects anything yet. The preview card gives a checkbox to each vendor the collect link names, and its primary action opens that link for the portals the user ticked. The Well browser extension collects from those portals, and only after the user starts them on that page. Use when the user asks to fetch, collect, or chase the invoices they are missing, says "launch the agents", "go get those invoices", "deploy the collectors", or when the fetch-missing-invoices flow reaches its last step after the missing rows have been listed and picked. Do not use to run a collection from the chat, to invoke a connector's own actions, to create or edit an invoice, to connect a provider, or to list which invoices are missing in the first place.
---

# Deploy Agents with Well

## Purpose

Show what a real invoice fetch would do, before anything is done. Take the vendors the user picked on
the missing-invoices card, group them into the agents Well would run — one per provider, with the
counterparties and transactions behind each — and state, in the user's language, what would happen:
which agents, which rows the user has to upload by hand, which providers are not connected yet. The
scope is the user's pick, not everything the period yields.

**This skill collects nothing.** It and its card start no agent, open no browser session and queue
no task. The card's primary action opens the collect link, which names the portals the user ticked.
The Well browser extension runs those portals, and only after the user starts them on that page. So
the honest sentence is not "the run has started" — it is "nothing has started here, and the
collection runs in the browser extension once you start it there". This skill never learns what a
run produced. This is the last brick of Well's fetch-missing-invoices flow.

## When to use this skill

Use this skill when:

- The user asks Well to fetch, collect, retrieve, or chase the invoices they are missing ("go get
  those invoices", "can you pull the March receipts from Shopify?").
- The user asks to launch, deploy, or start the agents, or asks what would run.
- The fetch-missing-invoices flow reaches its last step and its missing rows have already been
  listed and picked.
- The user wants the plan first: "what would you do?", "show me the plan before you run anything".

## When not to use this skill

Do not use this skill when:

- The user wants to know *which* invoices are missing — that is the `show-missing-invoices` skill,
  the step before this one; this skill reads that skill's hand-off rather than recomputing it.
- The user wants a fetch result, a downloaded file, or a status update on a running collection —
  this skill starts nothing and receives nothing back. The collect link its card opens hands the
  picked portals to the Well browser extension, and the extension's side panel reports the runs.
  Point the user there instead of promising progress.
- The user wants to connect a provider so it can be fetched from — that is the `connect-tools`
  skill.
- The user wants to create, edit, or attach an invoice by hand — those are Well's invoice skills
  and the Well app, not this one.
- No workspace or no period is pinned — run `define-workspace` and `define-period` first.

## Inputs

The calling skill or the user provides:

- The `show-missing-invoices` hand-off — required in practice. Its `agent_candidates` carry the rows
  this preview is built from. It carries no vendor pick: the pick is read from the session, as the
  next bullet says. Without the hand-off, and without the preview tool below, there is nothing to
  preview: say so, hand off `resolution: unavailable`, and stop. Never report that state as
  `nothing_to_do` — the period may hold plenty to fetch; the preview simply could not be built.
- The vendor selection — the pick the missing-invoices card wrote, read from `well_list_workspaces`'
  `session.selected_counterparties`. That field is null until a pick is recorded, and each entry
  under its `counterparties` is a `company_id` plus a `matched_connector_service_id` or null.
  **Route on those identifiers, never on a vendor's display name.** A null `selected_counterparties`
  means nothing is picked yet: send the flow back to `show-missing-invoices` for the click rather
  than previewing every row. The selection names the workspace its company ids belong to, so a pick
  whose `workspace_id` is not the pinned one is not this pass's pick. **A pick is trustworthy only
  for the gap-list card now on screen.** A pick taken on an earlier card — before a fresh gap-list
  read, or before a change of months — names rows the user is no longer looking at, so it is not
  this pass's pick either. Send the flow back to `show-missing-invoices` for a fresh tick rather
  than previewing on it.
- `workspace_id` — required. Comes from `define-workspace`, or from the session pin
  (`well_list_workspaces`' `session.pinned_workspace_id`) used silently only when THIS conversation
  established it. Hosts share one MCP session across conversations, so a pin this conversation never
  made is another conversation's leftover: ignore it, never mention it, and run `define-workspace`
  instead. Never resolved or asked for in text here.
- A period selection written server-side — required, but **not passed to the tool**: the user's
  click on the period card (or `define-period`) already wrote it, and the preview tool reads it on
  its own. The `define-period` hand-off's `period_label` is narration context only.
- `purpose` — one line from the calling skill, used in the ask when one is needed. Optional.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's
`workspace_queue` (read from `well_list_workspaces`' `session` block) name the sequence, and this
skill always works on the currently pinned workspace only. The caller re-pins with
`well_switch_workspace({ workspace_id })` between passes; each pass gets its own preview, and
nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). Only one tool is
involved, and it is optional:

- `well_preview_invoice_fetch` — **when it is present in your toolset.** Input: `workspace_id`
  explicitly, as on every `well_*` call, and **no periods argument** — omitted, the server uses the
  period selection the user's click (or `define-period`) already wrote. An error comes back only
  when no selection exists yet: run `define-period`, then re-call. A period pair is passed
  explicitly only on an older server that holds no session selection — the degrade path, never the
  default. Output: the period fields — `periods_requested`, `periods_covered` (each month as
  `calendar_year`, `calendar_month` and `period_label`, oldest first) and `months` (each month's own
  `counts`) on every success, plus `calendar_year`, `calendar_month`, `fiscal_year`, `fiscal_period`
  and `period_label` **only when the selection held exactly one month**, so a selection spanning
  several months carries no single label to quote — `agents` (each with `provider_name`,
  `provider_id` or null,
  `domain` — the provider's bare host, e.g. `aws.amazon.com` — and `url` — the portal address the
  catalog holds, which `domain` reduces to its host; both are null when unmatched or absent from the
  catalog, and both are display only — `logo_url`, `counterparties` — each `name`, its own month
  (`calendar_year`, `calendar_month`, `period_label`), `tx_count`, `base_total_amount` and
  `suggested_route` — `connect_routed_counterparties`, `tx_count`, and `base_total_amount` or null),
  `upload_rows` and `connect_rows` (their rows carry the same month tag), `counts`,
  `collect_url` — the collect link for the previewed portals — `collect_url_omits` — the portals a
  large window pushed past that link's ceiling, present only when some were left out —
  `scoped_to_selected_counterparties`, `mode: "preview"`, `nothing_launched: true`, and `hints`. It
  is a read: it computes the plan and returns it. Carry `provider_id`, `domain`,
  `scoped_to_selected_counterparties` and `hints` through to your hand-off — `provider_id` is the
  identifier the link names and a run routes on, `domain` only labels the portal on screen,
  `scoped_to_selected_counterparties` tells a scoped result from a period-wide one, and `hints` says
  how far the categorized data reaches.
- **A vendor Well holds a connector for stays an agent candidate.** Such a counterparty is in
  `connect_rows` AND under its portal's agent bucket, where its entry reads `suggested_route:
  "connect"` and the bucket's `connect_routed_counterparties` counts it. Connecting is the route to
  suggest, and the agent run stays available when the connector does not suit the user. Report one
  gap with two routes, never two gaps, and never add the two lists together. A connector match that
  carries no `provider_id` stays a connect row only: no link can address that portal. The rows the
  tool-absent path derives carry no `suggested_route` — `agent_candidates` groups the agent rows
  alone — so this only applies to a preview the tool returned.
- `scoped_to_selected_counterparties` — **the field that says what the result covers.** It is
  present and `true` only when the pick bounded at least one month of the window, and then every
  route covers the picked vendors only for the months the pick was made against — a month of the
  window the pick never covered is covered in full. It is absent when the server held no pick for
  this workspace, and absent too when the pick covers none of the months read; either way the result
  covers every gap of the months read. Read it before you describe the scope; never infer the scope
  from the row count.
- `collect_url` — **the one link to hand the user.** Its shape is
  `<well-app-base-url>/collect?workspace=<workspace_id>&providers=<entry>,<entry>,…`, and each entry
  is `<provider_id>[~<name>[~<url>]]`. The `provider_id` is required and is the only field that
  decides which portal runs; the page refuses an entry that does not start with one. The name and the
  host label the row and nothing more. Give it exactly as returned: never build a link yourself and
  never add or edit a parameter. The `workspace` parameter is required, and it gates WHO may act on
  the link: the link is forwardable, so the page starts nothing until the reader is signed in to Well
  as a member of that workspace, and it refuses every other reader. It does NOT choose where the
  invoices land — the extension files into whichever workspace it is signed in to — so never tell the
  user the link picks the destination. It is null when no previewed agent carries a `provider_id`.
  One link names at most 25 portals; `collect_url_omits` names the ones it left out, and no run
  reaches them from that link. The page needs the Well browser extension installed and signed in, and
  it says so on screen when it is not.
- **The preview card, in MCP-Apps hosts.** The result renders the vendors the collect link names
  with a checkbox per row, and shows the rest as vendors the link cannot take — no checkbox, because
  a tick there would promise a run the link never carries. A select-all appears only when the link
  names more than one vendor. The card's primary action opens the collect link for the portals still
  ticked, and the card starts nothing itself. So end your turn on the card and let the user tick and
  open it; do not restate the rows it draws, and never describe the open as a collection that
  finished.
- **When the tool is absent**, no tool call is needed at all. Derive the same preview from the
  `show-missing-invoices` hand-off's `agent_candidates`, which already carry the provider and its
  counterparties, narrowed to the picked `company_id` values. That path carries no `provider_id` and
  no `collect_url`, and a link cannot be built without the ids: give the workspace link instead and
  say the collection starts from the app's collect page, which this run cannot address.

Never call a tool that changes anything. Specifically: no `well_invoke_connector_tool`, no
`well_create_*`, no `well_update_*`, no `well_delete_*`, no connector action of any kind. This skill
reads or derives, and it never writes. It does not re-pin the session either: on a multi-workspace
run the caller calls `well_switch_workspace` between passes, as the Inputs section says.

**Composed skills.** Three Well skills own the steps this skill must not inline — invoke them,
don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no
  connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every call here
  carries.
- `define-period` — resolves the month or fiscal period and writes the selection server-side, which
  is what makes the periods argument unnecessary on the preview call.
- `show-missing-invoices` — lists the transactions with no invoice for that period, on the card the
  user picks the vendors to chase from. Supplies the `agent_candidates` this preview is built from,
  and is the only source of the preview on the tool-absent path. Its card records the pick in the
  session; its hand-off does not carry it, so read the pick from `well_list_workspaces`.

All three ship with the `well-skills` plugin. None has an inline fallback here: this skill resolves
no workspace of its own, guesses no month, and never rebuilds the gap list, so when one is absent
the workflow runs that skill instead of working around it.

## Workflow

Call each list or read tool once per step. The widget cards refresh themselves — never re-call a tool just to check progress.

1. **Tell a missing server apart from a missing tool.** Two different states, two different
   answers:
   - No `well_*` tool at all in your toolset → the Well MCP server has not been added to this host.
     Tell the user to add it at `https://api.wellapp.ai/v1/mcp`, then fall back to the hand-off if
     you have one.
   - `well_*` tools are there but `well_preview_invoice_fetch` is not → the tool simply does not
     exist in this host yet. Say nothing about it; take the tool-absent path in step 3. This is the
     normal state today, not a fault to report.
   A run derived entirely from the `show-missing-invoices` hand-off calls nothing, so neither check
   blocks it.

2. **Confirm the workspace, the period, and the pick.** Require `workspace_id` — from the caller, or
   a session pin used silently when this conversation established it. Missing workspace, or a pin left
   by another conversation → run `define-workspace` and never reuse or mention that leftover pin. If
   the preview tool answers that no period selection exists yet, run `define-period` (its picker
   writes the selection) and re-call — never pin either one here and never guess a month. Require
   the vendor pick too: when `well_list_workspaces`' `session.selected_counterparties` is null, or
   names a workspace other than the pinned one, run `show-missing-invoices` so its card takes the
   click, and preview nothing meanwhile. Pass `workspace_id` explicitly on any call you make.

3. **Build the preview, and keep it to the pick.**
   - Tool present → call `well_preview_invoice_fetch({ workspace_id })` — no periods argument; the
     server reads the clicked selection — and use its `agents`, `upload_rows`, `connect_rows`,
     `counts`, `scoped_to_selected_counterparties` and `collect_url` as they come, `provider_id`,
     `domain` and `url` included. Do not recompute or re-sort them.
     **`scoped_to_selected_counterparties: true` means the pick already bounded the result**: the
     server filtered every route to the recorded pick, for the months the pick was made against. Say the
     plan covers the picked vendors only for those months, and that a month of the window the pick
     never covered is covered in full. Narrow nothing further. One agent covers one supplier portal
     however many months the selection held, so never split or restate an agent per month: each
     counterparty under it names its own month, `months` carries each month's own route counts, and
     a selection spanning several months is named from `periods_covered` rather than under one label
     the result does not carry.
   - **Flag absent → the result covers the whole period, not the pick.** Either the server held no
     pick for this workspace, or the pick covers none of the months read; both leave every gap of
     those months in the routes. Narrow it from the `show-missing-invoices` hand-off's
     `agent_candidates` instead — those carry a `company_id` per counterparty, which the tool's rows
     do not, so they are the only identifier-matched way to reach the picked set. With no hand-off
     to narrow from, report the plan as covering the whole period and say so; never present a
     period-wide result as the pick.
   - Tool absent → reshape the hand-off's `agent_candidates`, which are already grouped by provider,
     into the `agents` shape below, keeping only the counterparties whose `company_id` is in the
     session's pick. Match on that id — never on a counterparty or provider name. One candidate
     group is one agent: its `provider_name`, its `counterparties` (each with `tx_count` and
     `base_total_amount`), its `tx_count`, and its `base_total_amount`. Carry no amount at all
     rather than a partial one when a counterparty in the group has none. For `upload_rows` and
     `connect_rows`, count the hand-off's `rows` whose `mode` is `upload` or `connect` and whose
     `company_id` is in the pick. The hand-off's `counts.upload` and `counts.connect` are
     period-wide numbers with no counterparty behind them: they cannot be narrowed, so never quote
     one under a pick-scoped answer.
   - An agent whose `provider_id` is null cannot be named on the collect link, so no run can carry
     it. Report it as a vendor the link cannot take, and never promise it will be fetched. A null
     `domain` is a missing label and nothing more: that agent still travels on its id. The portals
     the tool lists in `collect_url_omits` are outside the link too — report them the same way, as
     vendors this link does not cover.
   - A pick that yields no agent — every picked vendor is an upload or a connect row — still has
     something to report: keep `agents` empty, state those lines, and resolve `previewed`. Reserve
     `nothing_to_do` for a pick with nothing on any of the three routes.
   - The `"unknown"` group is never an agent, whichever path produced it — the one exception to
     using the tool's `agents` as they come. `show-missing-invoices` files the rows whose provider it
     could not match under `provider_name: "unknown"`, and no agent can be dispatched against a
     provider that was never identified. Keep that group out of `agents` and carry its `tx_count` as
     `unmatched_rows`, counted apart from `upload_rows` so neither number is misreported.
   - Carry a structured provider identifier on every agent. `provider_id` is the tool's
     `provider_id` when you called the tool; otherwise the `matched_connector_service_id` shared by
     that group's rows in the `show-missing-invoices` hand-off; otherwise null. Never make a later
     step identify a provider by its name alone.
   - No agents, no upload rows, no connect rows, and no unmatched rows → resolution
     `nothing_to_do`. Say the picked vendors have nothing to fetch and stop; do not manufacture a
     plan. A pick holding only an `"unknown"` group is **not** `nothing_to_do`: those transactions are
     still missing an invoice, so report them on their own line and resolve `previewed`.

4. **Say what would run — one line per agent, in the user's language.** Read the user's language from
   the conversation, not from the workspace country.
   - Write the lines yourself, each naming the provider and the count, each saying that nothing has
     started. French: `Agent prêt pour Shopify — 3 factures (rien n'est encore lancé)`. English:
     `Agent ready for Shopify — 3 invoices (nothing started yet)`. Name the counterparties only when
     the user asks or when one agent covers several and the names carry the meaning. Write these lines
     whatever the host drew — you cannot tell a host that drew the card from one that did not (see
     **How this reaches the user**) — but keep each to the provider and its count, and never expand
     one into the row detail the card carries. Above five agents, name the five largest by invoice
     count and close with one line covering the rest.
   - The count is a count of **transactions with no invoice attached** — how many invoices an agent
     would go looking for, not how many it would find. Say that once; never present it as a yield.
   - Print an amount only when `base_total_amount` is set. Never print `null`, and never sum across
     currencies that were not already converted to the workspace base currency.

   Then say what the link does, in one line, and end the turn. The card's own footer carries the
   mechanics — **Deploy** opens the collect link for the vendors still ticked, and waits there,
   disabled, while nothing is ticked; **Continue** stands in its place only when no vendor in this
   read is named on a collect link; **Keep for later** answers the conversation exactly as Continue
   does — so ask the user to confirm the vendors and deploy, and leave the labels to the card. Where
   no card is drawn, give the tool's `collect_url` when the tool ran and the workspace link
   otherwise, and say the collect page hands the picked portals to the Well browser extension once
   the user starts them there. Append no query parameter of your own to either link.

5. **Then the rows an agent does not fetch on its own — two lines always, a third when it
   applies.** On a previewed run: one line for the rows the user has to upload by hand
   (`upload_rows`) — no agent can fetch these. One line for the counterparties whose route is
   connecting a service (`connect_rows`) — connecting is the route Well suggests for them. Both
   counts are counterparty rows, one per month, so a vendor missing an invoice in two of the months
   read counts once for each of those months: say the unit on a window of several months, or
   count the distinct vendors yourself and say that is what you counted. A counterparty the tool also listed
   under a portal keeps its agent run: say the run stays available when the connector does not suit
   the user, and count that vendor once rather than on both lines. Both appear even at zero. State
   the count for each; when the tool returns the rows themselves rather than a count, name at most
   three and give the total. A third line, only when `unmatched_rows` is non-zero: Well could
   not match a provider for those transactions, so no agent covers them. Keep it a line of its own
   with its own count — folding it into `upload_rows` misreports both. On `nothing_to_do` step 3
   already closed the answer, and none of these lines apply. If the user connects a provider or
   uploads a document and says so, re-derive the preview yourself in the same turn and restate it —
   do not wait to be re-prompted.
   Same for a change of mind about the vendors: send the flow back to `show-missing-invoices` for a
   fresh pick rather than editing the selection from their sentence.

6. **Restate how far the preview reaches.** One line, every time. These counts cover the period's
   **categorized** expense transactions only, so spend that is not categorized yet cannot appear in
   the plan — the same caveat `show-missing-invoices` carried in its `coverage_note`, repeated here
   because this answer reprints the same counts. Use that `coverage_note` when you have it, and the
   tool's `hints` when you called the tool. When coverage is narrow and the
   `categorize-counterparties` skill is installed, offer it: categorizing the rest of the period
   widens what an agent run would cover.

7. **State plainly what has and has not started.** One sentence of its own, not a parenthesis: no
   agent has started here, no task is queued, and no browser session is open. Then say where a
   collection does start — the collect page hands the picked portals to the Well browser extension,
   and the extension's side panel reports the runs. Say it even where the card names agents. Never
   claim a launch, a result, a downloaded invoice, a success rate, or an ETA — neither this skill,
   its card, nor the page the link opens reports any of those. When the user reports that the link
   opened, say the page names the portals they picked and waits for them to start it; do not narrate
   a run nothing started, and do not report a refused link as a launch.

   The page can also refuse the reader before it shows any portal, and each refusal has one true
   reading. It asks the user to sign in to Well when no Well session is open, and it returns to the
   same link afterwards. It says the link is for another workspace when the signed-in account is not
   a member of the workspace the link names — that reader cannot start the collection, and a second
   link for the same portals would refuse them again, so point them at an account that is a member of
   this workspace. It says it cannot check the access when Well is unreachable, and a reload is the
   whole remedy. None of these is a failed collection: nothing ran, so report it as a link the reader
   could not open and never as an agent that tried and stopped.

8. **On failure, redirect instead of guessing.** A transient error on `well_preview_invoice_fetch`
   → retry once. A second failure → fall back to deriving the preview from the hand-off. With
   neither, do not invent a plan: give the user
   `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows the same missing rows
   there. Do not append a query parameter you have not confirmed the app reads.

9. **Hand off.** Keep the hand-off facts below for the caller — never printed as a block — and give control back.

## Output requirements

Return:

- One line per agent, in the user's language, each with the provider, the count, and the fact that
  nothing has started yet. Above five agents, the five largest by invoice count plus one line for the
  rest.
- One line for the counterparties to upload by hand, and one line for the counterparties still to
  connect — counterparty rows, one per month, not distinct vendors. Both lines appear even when the
  count is zero. A third line, only when `unmatched_rows` is non-zero, for the transactions whose
  provider Well could not identify. A fourth, only when an agent carries no `provider_id` or the
  tool listed it in `collect_url_omits`, for the vendors the collect link cannot name. On
  `nothing_to_do` the single nothing-to-fetch sentence replaces all of them.
- One line stating that the preview covers categorized expense transactions only.
- One line stating what the plan covers — the picked vendors only, for the months the pick was made
  against, when `scoped_to_selected_counterparties` is true; the whole period when that flag is
  absent and no hand-off narrowed the result.
- One line asking the user to confirm the vendors and deploy from the card — or, where no card is
  drawn, carrying the collect link itself.
- One plain sentence stating that no agent has started here, no task is queued and no browser session
  is open, and naming where a collection does start — the collect page hands the picked portals to
  the Well browser extension, whose side panel reports the runs.
- The hand-off, kept for the calling flow and never printed: `workspace_id` — the one this skill ran
  on, the same value every hand-off in this flow opens with; the period — the single-month fields
  when the result carried them, `periods_covered` plus the per-month `months` counts when it did
  not, so the caller is never told one month for a preview spanning several; `run_mode: preview`;
  `nothing_launched: true`; `selection` — the picked vendors as the session recorded them,
  `company_id` plus `matched_connector_service_id` or null, so a later step routes on identifiers
  and never on a vendor's name; the `agents` — each with its `provider_name`, `provider_id`, its
  `domain` or null, its counterparties (name, `tx_count`, `base_total_amount`), its summed
  `tx_count`, and its summed amount or null; `upload_rows`, `connect_rows`, and `unmatched_rows`;
  `collect_url` — the collect link when the tool returned one, else null;
  `scoped_to_selected_counterparties` — true when the tool scoped the result to the pick, absent
  otherwise; the `coverage_note` — categorized expense transactions only, plus the tool's `hints`
  when it ran; and `resolution` — `previewed`, `nothing_to_do`, or `unavailable`. `run_mode` names
  how this skill ran and is always `preview`; it mirrors the tool's `mode: "preview"` under a
  different key, because `mode` upstream means a row's `agent | connect | upload` badge.
  `provider_id` is the identifier the collect link names and a run dispatches on, and `domain` only
  labels the portal on screen; `provider_id` is null only when neither the tool nor the hand-off
  carries one. `unmatched_rows` counts the `"unknown"` group's transactions, which no agent covers.
  On `nothing_to_do`, `agents` is empty and every row count is zero or empty. On `unavailable` —
  neither the preview tool nor a `show-missing-invoices` hand-off was there to build a plan from —
  only `workspace_id`, the period, and `run_mode` are kept, and no counts are claimed. These keys
  are reasoning vocabulary for you and the calling flow; the hand-off travels as plain conversation,
  not as a data block.
- Connector coverage in plain words, on two axes. The `connect_rows` line **is** the connection
  disclosure: say which providers behind the missing rows are not connected. The `coverage_note`
  line is the data disclosure: the plan is drawn from categorized expense transactions only, so
  uncategorized spend can hide agents this preview does not show. Together they let the user tell a
  full preview from one narrowed by what is connected and what is categorized today.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is
  SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. Hand the block back to the caller — the
  `fetch-missing-invoices` flow — with the preview. When uncategorized spend could be hiding agents
  and the `categorize-counterparties` skill is installed, offer that instead: "Want me to
  categorize the rest of the period first, so nothing is hidden from this plan?". When the user asks
  to run the collection, point at the card's Deploy action — or at the collect link where no card is
  drawn — and say plainly that the collection runs in the browser extension, once they start it on
  that page. Never offer to run a collection from the chat, and never claim one has finished.
- Beyond the per-agent, upload, unmatched, connect, coverage, scope, deploy and nothing-started
  lines above, the answer stays plain sentences a non-technical user understands. Never print yaml,
  JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- Any claim that an agent ran, is running, or produced a result — including a percentage, a file, or
  an ETA — any claim that this skill or the collect page knows a run's outcome, and any claim that a
  link the host refused started a run.
- The row detail restated under the preview card that already shows it.
- A `null` amount printed as a number, or amounts summed across currencies.
- An agent for a provider that is not in the preview or in `agent_candidates`.
- The same vendor reported as two gaps, or the connect count added to the agent count, when the
  preview lists that counterparty on both routes.
- An agent named for a provider Well never matched — the `"unknown"` group is not an agent.
- A vendor promised to the run when its `provider_id` is null or the link left it out, or a collect
  link you built yourself.
- A selection edited from the user's sentence instead of a fresh pick on the missing-invoices card,
  or a pick taken on an earlier gap-list card carried into this preview.
- A period-wide result described as the pick when `scoped_to_selected_counterparties` is absent.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the preview cards from one that did
not. Write an answer that stands on its own and let the cards add to it where there are
some. Do not compose a second rendering of agents the tool already returned.

## Quality checks

Before finishing, verify:

- No write tool was called: no `well_invoke_connector_tool`, no `well_create_*`, no
  `well_update_*`, no `well_delete_*`, no connector action.
- `workspace_id` came from the caller, or from a session pin this conversation established — no
  leftover pin from another conversation was reused or mentioned. The period came from the
  server-held selection (the preview call carried no periods argument), and neither was resolved or
  guessed here.
- The preview came from `well_preview_invoice_fetch` when it exists, and from the
  `show-missing-invoices` hand-off's `agent_candidates` when it does not — never from a guess about
  which providers a workspace uses.
- The pick was in hand before anything was previewed: `session.selected_counterparties` naming the
  pinned workspace, matched on `company_id`, with a null pick — or a pick belonging to an earlier
  gap-list card — sent back to `show-missing-invoices` for a fresh click.
- The scope line came from `scoped_to_selected_counterparties`: the picked vendors only, for the
  months the pick was made against, when it was true; the whole period when it was absent and no
  hand-off narrowed the result.
- A preview spanning several months named every month from `periods_covered`, quoted no single
  `period_label` (the result carries none then) and composed no range label, kept one agent per
  portal across the months, and handed off `periods_covered` and the per-month `months` counts.
- One line per agent, in the user's language, each saying nothing has started, written whatever the
  host drew and never expanded into the row detail the card carries.
- The turn ended on the card with one line asking the user to confirm the vendors and deploy — or,
  where no card was drawn, carrying the collect link from the tool's `collect_url` or the workspace
  link, with no query parameter added and no workspace named in it.
- A counterparty the preview listed under a portal and in `connect_rows` was reported once, as one
  gap with two routes, and the two lists were never added together.
- On a previewed run the upload line and the connect line are both present, even at zero, each
  counted in counterparty rows — one per month — or in a distinct-vendor count the answer names as
  such, plus an `unmatched_rows` line of its own when that count is non-zero. On `nothing_to_do`
  none appear.
- No agent was built for the `"unknown"` group; its transactions were counted as `unmatched_rows`
  instead, never folded into `upload_rows`, and a period holding only that group resolved
  `previewed` rather than `nothing_to_do`.
- The categorized-only coverage line was stated, with the tool's `hints` when the tool ran.
- Every agent carries a `provider_id` — from the tool, or from the hand-off's
  `matched_connector_service_id` — and null only when neither source has one.
- The answer contains one plain sentence stating that nothing has started here, and naming the
  browser extension as where a collection starts once the user acts on the collect page.
- No launch, result, yield, or ETA is claimed anywhere, and a vendor whose `provider_id` is null — or
  one the tool listed in `collect_url_omits` — was reported as one the link cannot take rather than
  one an agent will fetch.
- Counts are described as transactions missing an invoice, not as invoices already found.
- Amounts appear only when set, and never mix currencies.
- After a connection or an upload landed, the preview was re-derived in the same turn.
- On a transient tool failure the call was retried once, then the hand-off was used, then the
  workspace link — in that order.
- The hand-off facts were kept — `workspace_id`, the period, `run_mode: preview`,
  `nothing_launched: true`, `selection`, the agents with their `provider_id` and `domain`,
  `collect_url`, `scoped_to_selected_counterparties`, `coverage_note`, and `resolution` — and no
  yaml, JSON, or fenced code block appears anywhere in the answer.
- A run with neither the preview tool nor a hand-off handed off `resolution: unavailable`, never
  `nothing_to_do`, and claimed no counts.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the hand-back to the caller, and any request to run the collection was
  answered with the card's Deploy action or the collect link plus the fact that the extension runs it
  once the user starts it there, never with a run from the chat or a finished run claimed anywhere.

## Examples

### Example request

The fetch-missing-invoices flow calls deploy-agents with `workspace_id` of Acme SAS, the March 2026
selection already written by the user's click on the period card, and the `show-missing-invoices`
hand-off, its `agent_candidates` covering Shopify (3 transactions, 1 counterparty) and Free Pro (2
transactions), with no `"unknown"` group, plus 4 `upload` rows and one `connect` row on an
unconnected Stripe account. The session holds a pick of three vendors for this workspace. The user
writes in French. `well_preview_invoice_fetch` is not in the toolset.

### Expected behavior

Keep the candidates whose `company_id` is in the session's pick, derive the preview from them, and
call nothing. Answer:

> Agent prêt pour Shopify — 3 factures (rien n'est encore lancé)
> Agent prêt pour Free Pro — 2 factures (rien n'est encore lancé)
> 4 lignes sont à téléverser à la main : aucun agent ne peut aller les chercher.
> 1 ligne dépend de Stripe, qui n'est pas encore connecté.
>
> Ce plan ne couvre que les dépenses déjà catégorisées de la période : ce qui ne l'est pas encore
> n'y apparaît pas.
>
> Aucun agent n'a démarré ici, aucune tâche n'est en file, aucune session de navigation n'est
> ouverte. La collecte se lance depuis l'extension Well, une fois que vous la démarrez sur la page
> de collecte. Ouvrez l'espace de travail dans l'app Well —
> `<well-app-base-url>/workspaces/<workspace_id>` — pour voir les mêmes lignes manquantes. Ces
> chiffres comptent les transactions sans facture, pas les factures déjà récupérées.

Then keep the hand-off — `workspace_id`, `run_mode: preview`, `nothing_launched: true`, the
`selection`, each agent's `provider_id` (the group's `matched_connector_service_id`, or null),
`collect_url: null`, `coverage_note`, `resolution: previewed` — and hand back to the caller.
Nothing more is printed. The hand-off carries no `scoped_to_selected_counterparties`: the tool never
ran, and the pick was applied here.

### Example request

Same flow, in a Claude Desktop session where `well_preview_invoice_fetch` **is** available.

### Expected behavior

Call `well_preview_invoice_fetch({ workspace_id })` — the server reads the clicked selection. The
result carries `scoped_to_selected_counterparties: true`, so it already covers the picked vendors
only. The preview card renders the vendors the link names with their checkboxes, its select-all, its
Preview badge and its Deploy action. Do not restate the rows. Say one line per agent — provider,
count, nothing started yet — then the upload line, the connect line, the line saying the plan covers
the picked vendors only, the coverage line carrying the tool's `hints`, one line asking the user to
confirm the vendors and deploy, and the plain sentence that nothing has started here and the
extension runs the collection once the user starts it on the collect page. Carry each agent's
`provider_id` and `domain`, plus the envelope's `collect_url` and
`scoped_to_selected_counterparties`, into the hand-off. End the turn there.

### Example request

"Great, now actually run them."

### Expected behavior

Say plainly that nothing runs from the chat. Deploy on the card opens the collect link for the
vendors still ticked, and the Well browser extension collects from those portals once the user
starts them on that page. Where no card is drawn, give the collect link from `collect_url`, or
`<well-app-base-url>/workspaces/<workspace_id>` when the preview carried none. Do not call any tool,
do not promise a run from the chat, and do not re-emit the preview as though it were a finished
run.

### Example request

Same flow, tool absent, and the hand-off's `agent_candidates` hold two groups: Amazon with three
counterparties (5 transactions) and `"unknown"` with two counterparties (2 transactions).

### Expected behavior

Build one agent, for Amazon. The `"unknown"` group is not an agent: Well matched no provider for
those rows, so nothing can be dispatched for them. Its 2 transactions become `unmatched_rows`, on a
line of their own rather than folded into `upload_rows`: "Agent ready for Amazon — 5 invoices
(nothing started yet)", then the upload line, then "2 transactions have no provider Well could
identify — no agent covers them", then the connect line, the coverage line, the deploy line, and the
plain sentence that nothing has started here. Never write "Agent ready for unknown".

### Example request

The flow calls deploy-agents for a period whose rows all already have an invoice attached —
`agent_candidates` is empty and there is nothing to upload or connect.

### Expected behavior

Return `resolution: nothing_to_do`: "Nothing to fetch for March — every categorized expense
transaction already has its invoice, and spend that is not categorized yet cannot appear here. No
agent has started, no task is queued, no browser session is open." The upload line, the connect line
and the deploy line are dropped: there is nothing to upload, nothing to connect and nothing to
collect. Keep an empty `agents` list with the `coverage_note` set, and hand back. Offer
`categorize-counterparties` when it is installed. Do not invent an agent, and do not offer to run
one anyway.

### Example request

The flow reaches this skill with no pick recorded — the missing-invoices card is on screen and
the user has ticked nothing yet.

### Expected behavior

Preview nothing. Say the pick comes first, run `show-missing-invoices` so its card takes the tick
and the Continue click, and come back once `well_list_workspaces`' `session.selected_counterparties`
names this workspace. Do not preview every vendor of the period as a stand-in for the pick.

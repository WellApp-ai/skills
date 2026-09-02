---
name: deploy-agents
requires: [define-workspace, define-period, show-missing-invoices]
description: Preview what Well would fetch for the vendors the user picked — which agents would run, over which counterparties and transactions, which rows need a manual upload, and which providers need connecting — then hand those vendors to the Well app. Nothing collects anything yet. The preview card gives a checkbox to each vendor the collect link names, and its primary action opens that link for the portals the user ticked. The Well browser extension collects from those portals, and only after the user starts them on that page. Use when the user asks to fetch, collect, or chase the invoices they are missing, says "launch the agents", "go get those invoices", "deploy the collectors", or when the fetch-missing-invoices flow reaches its last step after the missing rows have been listed and picked. Do not use to run a collection from the session, to invoke a connector's own actions, to create or edit an invoice, to connect a provider, or to list which invoices are missing in the first place.
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
  this preview is built from, and its `selection` plus `selection_state` carry the vendor pick, as
  the next bullet says. Without the hand-off, and without the preview tool, there is nothing to
  preview: say so, hand off `resolution: unavailable`, and stop. Never report that state as
  `nothing_to_do` — the period may hold plenty to fetch; the preview simply could not be built.
- The vendor selection — the pick the missing-invoices card wrote. Read it from the
  `show-missing-invoices` hand-off, which carries it on two fields: `selection` names the picked
  vendors, each as its `company_id` plus its `matched_connector_service_id` or null, in the order the
  pick came in; `selection_state` says what that list means.
  **Route on those identifiers, never on a vendor's display name.**
    - `written` — the pick is recorded. Preview the `selection`.
    - `pending` — the card is on screen and nothing is ticked yet. Send the flow back to
      `show-missing-invoices` for the click rather than previewing every row.
    - `none` — the gap list was empty or unavailable, so it held nothing to pick. This is not a
      missing pick and it never asks for a tick: an empty list resolves `nothing_to_do`, an
      unavailable one resolves `unavailable`.
  `well_list_workspaces`' `session.selected_counterparties` is the resync fallback, for a click the
  hand-off missed and for a run that reaches this skill with no hand-off at all. That field is null
  until a pick is recorded, and each entry under its `counterparties` is a `company_id` plus a
  `matched_connector_service_id` or null. It also names the workspace its company ids belong to, so a
  pick whose `workspace_id` is not the pinned one is not this pass's pick. **A pick is trustworthy
  only for the gap-list card now on screen.** A pick taken on an earlier card — before a fresh
  gap-list read, or before a change of months — names rows the user is no longer looking at, so it is
  not this pass's pick either. Send the flow back to `show-missing-invoices` for a fresh tick rather
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

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). Two read-only tools
are involved. The preview tool is optional, and the session read is a resync fallback:

- `well_preview_invoice_fetch` — **call it when it is in your toolset.** Input: `workspace_id`
  explicitly, and no periods argument — the server reads the period selection the user's click (or
  `define-period`) already wrote. If it answers that no selection exists yet, run `define-period`
  and re-call; never guess a month or pin one here. It is a read: it computes the plan for the
  workspace's clicked selection and returns it, and never launches anything. Carry `provider_id`,
  `domain`, `scoped_to_selected_counterparties` and `hints` from its result through to your
  hand-off, and give `collect_url` to the user exactly as returned — never build a link yourself or
  edit a parameter on it. For the full field-by-field shape of its output, what
  `scoped_to_selected_counterparties` changes about the answer, and the `collect_url` addressing
  contract, read `references/preview-tool-contract.md`.
- **The preview card, in MCP-Apps hosts.** It renders the vendors the collect link names with a
  checkbox each, and shows every other vendor with no checkbox — a tick there would promise a run
  the link never carries. Its primary action opens the collect link for the portals still ticked;
  the card starts nothing itself. End your turn on the card; never restate the rows it draws or
  describe the open as a finished collection.
- `well_list_workspaces` — **the resync read, and the only other tool this skill calls.** Its
  `session` block carries `selected_counterparties`, `pinned_workspace_id` and `workspace_queue`.
  Read it only to resync — for a click the hand-off missed, or a run with no hand-off at all —
  never as a first move when the hand-off already carries the pick.
- **When the preview tool is absent**, call nothing. Derive the same preview from the
  `show-missing-invoices` hand-off's `agent_candidates`, narrowed to the picked `company_id` values.
  That path carries no `provider_id` and no `collect_url`; give the workspace link instead and say
  the collection starts from the app's collect page, which this run cannot address.

Never call a tool that changes anything: no `well_invoke_connector_tool`, no `well_create_*`, no
`well_update_*`, no `well_delete_*`, no connector action of any kind. This skill reads or derives
and never writes, and it does not re-pin the session — on a multi-workspace run the caller re-pins
with `well_switch_workspace` between passes, as the Inputs section says.

**Composed skills.** Three Well skills own the steps this skill must not inline — invoke them,
don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no
  connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every call here
  carries.
- `define-period` — resolves the month or fiscal period and writes the selection server-side, which
  is what makes the periods argument unnecessary on the preview call.
- `show-missing-invoices` — lists the transactions with no invoice for that period, on the card the
  user picks the vendors to chase from. Supplies the `agent_candidates` this preview is built from,
  and is the only source of the preview on the tool-absent path. Its hand-off carries the pick as
  well — `selection` and `selection_state` — which is what keeps this step from previewing a vendor
  the user never ticked.

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
   the vendor pick too, and take it from the `show-missing-invoices` hand-off. `selection_state:
   written` → preview its `selection`. `pending` → run `show-missing-invoices` so its card takes the
   click, and preview nothing meanwhile. `none` → the list held nothing to pick, so resolve
   `nothing_to_do` on an empty list and `unavailable` on an unavailable one, and ask for no tick no
   card can take. With no hand-off, or to catch a click the hand-off missed, read
   `well_list_workspaces`' `session.selected_counterparties` instead: a null field, or one naming a
   workspace other than the pinned one, reads as `pending`. Pass `workspace_id` explicitly on any
   call you make.

3. **Build the preview, and keep it to the pick.**
   - Tool present → call `well_preview_invoice_fetch({ workspace_id })` — no periods argument — and
     use its `agents`, `upload_rows`, `connect_rows`, `counts`, `scoped_to_selected_counterparties`
     and `collect_url` as they come, `provider_id`, `domain` and `url` included. Do not recompute or
     re-sort them.
   - `scoped_to_selected_counterparties: true` means the pick already bounded the result: say the
     plan covers the picked vendors only, for the months the pick was made against, and that a month
     the pick never covered is covered in full. One agent covers one portal across every month the
     selection held — never split or restate one per month.
   - Flag absent → the result covers the whole period, not the pick. Narrow it from the
     `show-missing-invoices` hand-off's `agent_candidates` instead, matching on `company_id`; with no
     hand-off to narrow from, report the plan as period-wide and say so.
   - Tool absent → reshape the hand-off's `agent_candidates` into the same `agents` shape, keeping
     only counterparties whose `company_id` is in the pick, matched on that id — never on a name.
     Derive `upload_rows` and `connect_rows` by counting the hand-off's `rows` whose `mode` and
     `company_id` match; never quote the hand-off's period-wide `counts.upload` / `counts.connect`
     under a pick-scoped answer.
   - The `"unknown"` group is never an agent, on either path: those rows carry no matched provider,
     so no agent can be dispatched for them. Keep it out of `agents` and count its rows as
     `unmatched_rows`, separate from `upload_rows`.
   - No agents, no upload rows, no connect rows, and no unmatched rows → resolution
     `nothing_to_do`. A pick holding only an `"unknown"` group is **not** `nothing_to_do`: report it
     on its own line and resolve `previewed`.
   - Carry a structured `provider_id` on every agent — the tool's, else the hand-off's
     `matched_connector_service_id`, else null. Never let a later step identify a provider by name
     alone.

   For the full derivation rules — the connector-match-stays-an-agent-candidate case, the
   `selection_scope` truncation numbers, and every edge case above worked through in full, read
   `references/preview-tool-contract.md` and `references/building-and-reporting.md`.

4. **Say what would run — one line per agent, in the user's language.** Read the user's language
   from the conversation, not the workspace country.
   - Write the lines yourself, each naming the provider and the count, each saying nothing has
     started. French: `Agent prêt pour Shopify : 3 factures (rien n'est encore lancé)`. English:
     `Agent ready for Shopify: 3 invoices (nothing started yet)`. Name counterparties only when the
     user asks or one agent covers several and the names carry the meaning. Above five agents, name
     the five largest by invoice count and close with one line covering the rest.
   - The count is transactions with no invoice attached — how many invoices an agent would go
     looking for, never a yield. Print an amount only when `base_total_amount` is set, and never sum
     across currencies not already converted to the workspace base currency.

   Then say what the link does, in one line, and end the turn. The card's own footer carries the
   mechanics — **Deploy** opens the collect link for the vendors still ticked and waits, disabled,
   while nothing is ticked; **Continue** stands in its place only when no vendor in this read is
   named on a collect link; **Keep for later** sits beside either one and only sends its own label
   into the conversation and opens nothing. Ask the user to confirm the vendors and deploy, and leave
   the labels to the card. Where no card is drawn, give the tool's `collect_url` when the tool ran and
   the workspace link otherwise, and say the collect page hands the picked portals to the Well
   browser extension once the user starts them there. Append no query parameter of your own to
   either link.

5. **Then the rows an agent does not fetch on its own — two lines always, a third when it
   applies.** One line for `upload_rows` — the rows the user has to upload by hand, no agent can
   fetch these. One line for `connect_rows` — counterparties whose route is connecting a service,
   which is the route Well suggests for them. Both are counterparty rows, one per month, so a
   vendor missing an invoice in two of the months read counts once per month — say that unit on a
   multi-month window, or count distinct vendors yourself and say that is what you counted. Both
   lines appear even at zero. A third line, only when `unmatched_rows` is non-zero, for the
   transactions whose provider Well could not identify — keep it a line of its own; folding it into
   `upload_rows` misreports both. On `nothing_to_do` step 3 already closed the answer and none of
   these lines apply. If the user connects a provider or uploads a document and says so, re-derive
   the preview yourself in the same turn and restate it — do not wait to be re-prompted. Same for a
   change of mind about the vendors: send the flow back to `show-missing-invoices` for a fresh pick
   rather than editing the selection from their sentence.
   For the exact counting rules — one per month vs. distinct-vendor, and a portal that is both an
   agent and a connect row — read `references/building-and-reporting.md`.

6. **Restate how far the preview reaches.** One line, every time: these counts cover the period's
   **categorized** expense transactions only, so spend not categorized yet cannot appear in the
   plan — the same caveat `show-missing-invoices` carried as `coverage_note`. Use that
   `coverage_note` when you have it, and the tool's `hints` when you called the tool. Categorizing
   the vendors does not widen this bound: never offer `categorize-counterparties` as though it
   did — that skill writes the vendor company's industry labels, while this plan is bounded by
   TRANSACTION categorization, a different field on a different record.

7. **State plainly what has and has not started.** One sentence of its own: no agent has started
   here, no task is queued, and no browser session is open. Then say where a collection does
   start — the collect page hands the picked portals to the Well browser extension, and the
   extension's side panel reports the runs. Say it even where the card names agents. Never claim a
   launch, a result, a downloaded invoice, a success rate, or an ETA. When the user reports that the
   link opened, say the page names the portals they picked and waits for them to start it.

   The collect page can also refuse the reader before it shows any portal — for no signed-in
   session, for a signed-in account that is not a member of the workspace, or when Well is
   unreachable. None of these is a failed collection: nothing ran, so report each as a link the
   reader could not open, never as an agent that tried and stopped. For the exact wording each
   refusal calls for, read `references/building-and-reporting.md`.

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
  connect — counterparty rows, one per month, or a distinct-vendor count the line names as such.
  Both lines appear even when the count is zero. A third line, only when `unmatched_rows` is
  non-zero, for the transactions whose provider Well could not identify. A fourth, only when an
  agent carries no `provider_id` or the tool listed it in `collect_url_omits`, for the vendors the
  collect link cannot name. On `nothing_to_do` the single nothing-to-fetch sentence replaces all of
  them.
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
  not; `run_mode: preview` — it names how this skill ran and mirrors the tool's `mode: "preview"`
  under a different key, because `mode` upstream means a row's `agent | connect | upload` badge;
  `nothing_launched: true`; `selection` — the picked vendors as the
  hand-off carried them, `company_id` plus `matched_connector_service_id` or null; the `agents` —
  each with its `provider_name`, `provider_id`, its `domain` or null, its counterparties (name,
  `tx_count`, `base_total_amount`), its summed `tx_count`, and its summed amount or null;
  `upload_rows`, `connect_rows`, and `unmatched_rows`; `collect_url` — the collect link when the tool
  returned one, else null; `scoped_to_selected_counterparties` — true when the tool scoped the
  result to the pick, absent otherwise; the `coverage_note` — categorized expense transactions
  only, plus the tool's `hints` when it ran; and `resolution` — `previewed`, `nothing_to_do`, or
  `unavailable`. On `nothing_to_do`, `agents` is empty and every row count is zero or empty. On
  `unavailable` — neither the preview tool nor a `show-missing-invoices` hand-off was there to build
  a plan from — only `workspace_id`, the period, and `run_mode` are kept, and no counts are claimed.
  These keys are reasoning vocabulary for you and the calling flow; the hand-off travels as plain
  conversation, not as a data block.
- Connector coverage in plain words, on two axes. The `connect_rows` line **is** the connection
  disclosure: say which providers behind the missing rows are not connected. The `coverage_note`
  line is the data disclosure: the plan is drawn from categorized expense transactions only, so
  uncategorized spend can hide agents this preview does not show. Together they let the user tell a
  full preview from one narrowed by what is connected and what is categorized today.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is
  SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. Hand the block back to the caller — the
  `fetch-missing-invoices` flow — with the preview. When the connect line is non-zero and the
  `connect-tools` skill is installed, offer that instead: "Want me to connect the tools behind those
  vendors first?" — connecting is the route the preview suggests for them. Never offer
  `categorize-counterparties` as a way to uncover agents this preview does not show. When the user
  asks to run the collection, point at the card's Deploy action — or at the collect link where no
  card is drawn — and say plainly that the collection runs in the browser extension, once they start
  it on that page. Never offer to run a collection from the session, and never claim one has finished.
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
- `categorize-counterparties` offered as a way to widen the preview — it writes the vendor
  company's industry labels, and this plan is bounded by transaction categorization.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the preview cards from one that
did not. Write an answer that stands on its own and let the cards add to it where there
are some. State the agents in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

For the full checklist to run before you answer, read `references/quality-checklist.md`. For
worked examples across a written pick, an available preview tool, a run request after the preview,
an unknown-group case, a nothing-to-do case, and a pending pick, read `references/examples.md`.

## Voice

<!-- voice:begin -->
Write like a brilliant, understated operations colleague. Hold the tone professional and casual at the same time, confident but never arrogant, credible but easy to follow, warm but never cute. This governs every message of the run, whichever step produced it. Precedence is fixed: when a step hands you an exact string to write, write it exactly as given, dashes and capitals included; these rules govern the prose you compose yourself.

Lead with the outcome, then the detail behind it. Write short active sentences a non-technical reader understands. Use sentence case for the headings and labels you write yourself. Name a real button or card label exactly as the app renders it, such as Use, Validate, Continue, or Deploy, so the user reads the same word on screen. Prefer a concrete number or a real example over an abstract claim.

Never write an em dash or an en dash. Use a period, a comma, or a colon instead. Never write an exclamation mark or an emoji. Keep an acknowledgement brief and specific, such as "Got it, pulling those invoices now." Skip preamble, superlatives, and self-praise.

Drop the habits that make an answer sound generic:

- Hedging transitions, such as "Furthermore", "Moreover", "Additionally", or "In today's fast-paced landscape".
- Buzzwords, such as leverage, delve, harness, foster, revolutionize, revolutionise, streamline, optimize, optimise, seamless, game-changer, cutting-edge, best-in-class, world-class, unparalleled, disruptive, synergy, blockchain, and crypto.
- Hollow contrast, such as "not just X, but Y".
- Vague praise, such as powerful, robust, intelligent, frictionless, elegant, or advanced.

Reach for these verbs first: ask, drop, connect, get, surface, compose, share, route, enrich, learn, reconcile, match, flag.

Keep to the house words in what you write to the user. Write "connect", never "integrate". Write "sessions", never "chat". Write "business data", never "financial data". Write "tokens", never "credits". Name every object by its own name, the workspace, the connector, the company, or the invoice, and never show the user a raw id on its own. A Well app address is a link, not an id, so keep it whole even when it carries a workspace id.
<!-- voice:end -->

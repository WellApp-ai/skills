---
name: deploy-agents
requires: [define-workspace, define-period, show-missing-invoices]
description: Preview what Well would fetch for the vendors the user picked — which agents would run, over which counterparties and transactions, which rows need a manual upload, and which providers need connecting — then hand the run to the Well app. The chat starts nothing. The preview card carries a checkbox per vendor and a select-all, and its primary action opens the workspace's acquisition link for the providers the user ticked, where the collection actually runs. Use when the user asks to fetch, collect, or chase the invoices they are missing, says "launch the agents", "go get those invoices", "deploy the collectors", or when the fetch-missing-invoices flow reaches its last step after the missing rows have been listed and picked. Do not use to run a collection from the chat, to invoke a connector's own actions, to create or edit an invoice, to connect a provider, or to list which invoices are missing in the first place.
---

# Deploy Agents with Well

## Purpose

Show what a real invoice fetch would do, before anything is done. Take the vendors the user picked on
the missing-invoices card, group them into the agents Well would run — one per provider, with the
counterparties and transactions behind each — and state, in the user's language, what would happen:
which agents, which rows the user has to upload by hand, which providers are not connected yet. The
scope is the user's pick, not everything the period yields.

**Nothing runs from the chat.** This skill and its card start no agent, open no browser session and
queue no task. The card's primary action opens the workspace's acquisition link in the Well app for
the providers the user ticked, and the web app runs the collection from there. So the honest sentence
is not "nothing will happen" — it is "nothing has started yet, and the Well app is what starts it".
This is the last brick of Well's fetch-missing-invoices flow.

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
- The user wants a fetch result, a downloaded file, or a status update on a running collection — this
  skill cannot follow or report on one. The acquisition link its card opens is where a run starts and
  where its progress shows; point them there.
- The user wants to connect a provider so it can be fetched from — that is the `connect-tools`
  skill.
- The user wants to create, edit, or attach an invoice by hand — those are Well's invoice skills
  and the Well app, not this one.
- No workspace or no period is pinned — run `define-workspace` and `define-period` first.

## Inputs

The calling skill or the user provides:

- The `show-missing-invoices` hand-off — required in practice. Its `selection` names the vendors to
  preview, and its `agent_candidates` carry the rows behind them. Without it, and without the preview
  tool below, there is nothing to preview: say so, hand off `resolution: unavailable`, and stop.
  Never report that state as `nothing_to_do` — the period may hold plenty to fetch; the preview
  simply could not be built.
- The vendor selection — the pick the missing-invoices card wrote, carried in that hand-off's
  `selection` and readable from `well_list_workspaces`' `session.selected_counterparties`. Each entry
  is a `company_id` plus a `matched_connector_service_id` or null. **Route on those identifiers,
  never on a vendor's display name.** With `selection_state: pending` nothing is picked yet: send the
  flow back to `show-missing-invoices` for the click rather than previewing every row. The selection
  belongs to one workspace and a switch to another clears it, so a pick read for a different
  workspace than the pinned one is not this pass's pick.
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
  default. Output: the period fields, `agents` (each with `provider_name`, `provider_id` or null,
  `domain` — the provider's bare host, e.g. `aws.amazon.com`, null when unmatched or absent from the
  catalog — `logo_url`, `counterparties` — each `name`, `tx_count`, `base_total_amount` —
  `tx_count`, and `base_total_amount` or null), `upload_rows`, `connect_rows`, `counts`,
  `acquisition_url` — the workspace's acquisition page for the previewed providers' hosts —
  `mode: "preview"`, `nothing_launched: true`, and `hints`. It is a read: it computes the plan and
  returns it. Carry `provider_id`, `domain` and `hints` through to your hand-off — `provider_id` is
  the identifier a run routes on, `domain` is the host the acquisition link carries, and `hints` says
  how far the categorized data reaches.
- **The preview card, in MCP-Apps hosts.** The result renders the previewed vendors with a checkbox
  per row and a select-all, and its primary action opens the acquisition link — the workspace's
  acquisition page for the hosts of the providers still ticked. The card starts nothing itself: the
  Well app runs the collection once the link is open. So end your turn on the card and let the user
  tick and open it; do not restate the rows it draws, and never describe the link as a launch that
  already happened.
- **When the tool is absent**, no tool call is needed at all. Derive the same preview from the
  `show-missing-invoices` hand-off's `agent_candidates`, which already carry the provider and its
  counterparties, narrowed to the picked `company_id` values. That path carries no provider host and
  no `acquisition_url`, so it also carries no link to open: give the workspace link instead and say
  the Well app is where the fetch runs.

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
- `show-missing-invoices` — lists the transactions with no invoice for that period and takes the
  user's pick of the vendors to chase. Supplies the `selection` that scopes this preview and the
  `agent_candidates` behind it, and is the only source of the preview on the tool-absent path.

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
   writes the selection) and re-call — never pin either one here and never guess a month. Require the
   vendor pick too: with `selection_state: pending`, or no `selection` at all, run
   `show-missing-invoices` so its card takes the click, and preview nothing meanwhile. Pass
   `workspace_id` explicitly on any call you make.

3. **Build the preview, and keep it to the pick.**
   - Tool present → call `well_preview_invoice_fetch({ workspace_id })` — no periods argument; the
     server reads the clicked selection — and use its `agents`, `upload_rows`, `connect_rows`,
     `counts` and `acquisition_url` as they come, `provider_id` and `domain` included. Do not
     recompute or re-sort them. **The tool answers for the whole period, not for the pick**, and the
     card starts with every vendor the link can name already ticked. So keep your own lines to the
     picked vendors, and never say the plan is limited to the pick when the card shows more than the
     user chose.
   - Tool absent → reshape the hand-off's `agent_candidates`, which are already grouped by
     provider, into the `agents` shape below, keeping only the counterparties whose `company_id` is
     in the `selection`. Match on that id — never on a counterparty or provider name. One candidate
     group is one agent: its `provider_name`, its `counterparties` (each with `tx_count` and
     `base_total_amount`), its `tx_count`, and its `base_total_amount`. Carry no amount at all rather
     than a partial one when a counterparty in the group has none. The hand-off's `counts.upload` and
     `counts.connect` are `upload_rows` and `connect_rows`, narrowed the same way.
   - An agent whose `domain` is null cannot be named on the acquisition link, so no run can carry it.
     Report it as a vendor the link cannot take, and never promise it will be fetched.
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

   Then say how the run starts, in one line, and end the turn. The card's own footer carries the
   mechanics — **Deploy** opens the workspace's collection page for the vendors still ticked,
   **Continue** stands in its place when there is no link to open, and **Keep for later** leaves the
   card be — so ask the user to confirm the vendors and deploy, and leave the labels to the card.
   Where no card is drawn, give the tool's `acquisition_url` when the tool ran and the workspace link
   otherwise, and say the Well app runs the collection from there. Append no query parameter of your
   own to either link.

5. **Then the rows no agent covers — two lines always, a third when it applies.** On a previewed
   run: one line for the rows the user has to upload by hand (`upload_rows`) — no agent can fetch
   these. One line for the providers that are not connected yet (`connect_rows`) — nothing can be
   fetched from them until they are. Both appear even at zero. State the count for each; when the
   tool returns the rows themselves rather than a count, name at most three and give the total. A
   third line, only when `unmatched_rows` is non-zero: Well could not match a provider for those
   transactions, so no agent covers them. Keep it a line of its own with its own count — folding it
   into `upload_rows` misreports both. On `nothing_to_do` step 3 already closed the answer, and none
   of these lines apply. If the user connects a provider or uploads a document and says so,
   re-derive the preview yourself in the same turn and restate it — do not wait to be re-prompted.
   Same for a change of mind about the vendors: send the flow back to `show-missing-invoices` for a
   fresh pick rather than editing the selection from their sentence.

6. **Restate how far the preview reaches.** One line, every time. These counts cover the period's
   **categorized** expense transactions only, so spend that is not categorized yet cannot appear in
   the plan — the same caveat `show-missing-invoices` carried in its `coverage_note`, repeated here
   because this answer reprints the same counts. Use that `coverage_note` when you have it, and the
   tool's `hints` when you called the tool. When coverage is narrow and the
   `categorize-counterparties` skill is installed, offer it: categorizing the rest of the period
   widens what an agent run would cover.

7. **State plainly where the run starts.** One sentence of its own, not a parenthesis: no agent has
   started, no task is queued, no browser session is open, and the collection begins in the Well app
   once the link is open. Say it even where the card names agents. Never claim a launch, a result, a
   downloaded invoice, a success rate, or an ETA — you have none of those, and neither this skill nor
   its card can produce them. When the user reports that the link opened, say the run is in the Well
   app and its progress shows there; do not narrate a run you cannot read, and do not report a
   refused link as a launch.

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
- One line for the rows to upload by hand, and one line for the providers still to connect. Both
  lines appear even when the count is zero. A third line, only when `unmatched_rows` is non-zero, for
  the transactions whose provider Well could not identify. A fourth, only when an agent carries no
  `domain`, for the vendors the collection link cannot name. On `nothing_to_do` the single
  nothing-to-fetch sentence replaces all of them.
- One line stating that the preview covers categorized expense transactions only.
- One line asking the user to confirm the vendors and deploy from the card — or, where no card is
  drawn, carrying the collection link itself.
- One plain sentence stating that no agent has started, no task is queued, and no browser session is
  open, and that the collection begins in the Well app once the link is open.
- The hand-off, kept for the calling flow and never printed: `workspace_id` — the one this skill
  ran on, the same value every hand-off in this flow opens with; the period; `run_mode: preview`;
  `nothing_launched: true`; `selection` — the picked vendors as they arrived, `company_id` plus
  `matched_connector_service_id` or null, so a later step routes on identifiers and never on a
  vendor's name; the `agents` — each with its `provider_name`, `provider_id`, its `domain` or null,
  its counterparties (name, `tx_count`, `base_total_amount`), its summed `tx_count`, and its summed
  amount or null; `upload_rows`, `connect_rows`, and `unmatched_rows`; `acquisition_url` — the
  collection link when the tool returned one, else null; the `coverage_note` —
  categorized expense transactions only, plus the tool's `hints` when it ran; and `resolution` —
  `previewed`, `nothing_to_do`, or `unavailable`. `run_mode` names how this skill ran and is always
  `preview`; it mirrors the tool's `mode: "preview"` under a different key, because `mode` upstream
  means a row's `agent | connect | upload` badge. `provider_id` is the identifier a run dispatches
  on and `domain` is the host the collection link names; `provider_id` is null only when neither the
  tool nor the hand-off carries one.
  `unmatched_rows` counts the `"unknown"` group's transactions, which no agent covers. On
  `nothing_to_do`, `agents` is empty and every row count is zero or empty. On `unavailable` —
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
  to run the collection, point at the card's Deploy action — or at the collection link where no card
  is drawn — and say the Well app is what runs it. Never offer to run it from the chat.
- Beyond the per-agent, upload, unmatched, connect, coverage, deploy and nothing-started lines above, the
  answer stays plain sentences a non-technical user understands. Never print yaml, JSON, or a fenced
  code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- Any claim that an agent ran, is running, or produced a result — including a percentage, a file, or
  an ETA — and any claim that a link the host refused started a run.
- The row detail restated under the preview card that already shows it.
- A `null` amount printed as a number, or amounts summed across currencies.
- An agent for a provider that is not in the preview or in `agent_candidates`.
- An agent named for a provider Well never matched — the `"unknown"` group is not an agent.
- A vendor promised to the run when its `domain` is null, or a collection link you built yourself.
- A selection edited from the user's sentence instead of a fresh pick on the missing-invoices card.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the preview cards from one that did
not. Write an answer that stands on its own and let the cards add to it where there are
some. Do not compose a second rendering of agents the tool already returned; where a visual
the tool does not draw genuinely reads better and the `well-design-system` skill is
available, use it.

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
- The pick was in hand before anything was previewed: a `selection` from the caller or the session,
  matched on `company_id`, with a pending pick sent back to `show-missing-invoices` for the click.
- One line per agent, in the user's language, each saying nothing has started, written whatever the
  host drew and never expanded into the row detail the card carries.
- The turn ended on the card with one line asking the user to confirm the vendors and deploy — or,
  where no card was drawn, carrying the collection link from the tool's `acquisition_url` or the
  workspace link, with no query parameter added.
- On a previewed run the upload line and the connect line are both present, even at zero, plus an
  `unmatched_rows` line of its own when that count is non-zero. On `nothing_to_do` none appear.
- No agent was built for the `"unknown"` group; its transactions were counted as `unmatched_rows`
  instead, never folded into `upload_rows`, and a period holding only that group resolved
  `previewed` rather than `nothing_to_do`.
- The categorized-only coverage line was stated, with the tool's `hints` when the tool ran.
- Every agent carries a `provider_id` — from the tool, or from the hand-off's
  `matched_connector_service_id` — and null only when neither source has one.
- The answer contains one plain sentence stating that nothing has started yet and that the Well app
  runs the collection once the link is open.
- No launch, result, yield, or ETA is claimed anywhere, and a vendor whose `domain` is null was
  reported as one the link cannot take rather than one an agent will fetch.
- Counts are described as transactions missing an invoice, not as invoices already found.
- Amounts appear only when set, and never mix currencies.
- After a connection or an upload landed, the preview was re-derived in the same turn.
- On a transient tool failure the call was retried once, then the hand-off was used, then the
  workspace link — in that order.
- The hand-off facts were kept — `workspace_id`, the period, `run_mode: preview`,
  `nothing_launched: true`, `selection`, the agents with their `provider_id` and `domain`,
  `acquisition_url`, `coverage_note`, and `resolution` — and no yaml, JSON, or fenced code block
  appears anywhere in the answer.
- A run with neither the preview tool nor a hand-off handed off `resolution: unavailable`, never
  `nothing_to_do`, and claimed no counts.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the hand-back to the caller, and any request to run the collection was
  answered with the card's Deploy action or the collection link, never with a run from the chat.

## Examples

### Example request

The fetch-missing-invoices flow calls deploy-agents with `workspace_id` of Acme SAS, the March 2026
selection already written by the user's click on the period card, and the `show-missing-invoices`
hand-off: a `selection` of three picked vendors, and `agent_candidates` covering Shopify (3
transactions, 1 counterparty) and Free Pro (2 transactions), with no `"unknown"` group, plus
`counts.upload` of 4 and one `connect` row on an unconnected Stripe account. The user writes in
French. `well_preview_invoice_fetch` is not in the toolset.

### Expected behavior

Keep the candidates whose `company_id` is in the `selection`, derive the preview from them, and call
nothing. Answer:

> Agent prêt pour Shopify — 3 factures (rien n'est encore lancé)
> Agent prêt pour Free Pro — 2 factures (rien n'est encore lancé)
> 4 lignes sont à téléverser à la main : aucun agent ne peut aller les chercher.
> 1 ligne dépend de Stripe, qui n'est pas encore connecté.
>
> Ce plan ne couvre que les dépenses déjà catégorisées de la période : ce qui ne l'est pas encore
> n'y apparaît pas.
>
> Aucun agent n'a démarré, aucune tâche n'est en file, aucune session de navigation n'est ouverte.
> La collecte démarre dans l'app Well : ouvrez la page de collecte de l'espace de travail
> `<well-app-base-url>/workspaces/<workspace_id>`. Ces chiffres comptent les transactions sans
> facture, pas les factures déjà récupérées.

Then keep the hand-off — `workspace_id`, `run_mode: preview`, `nothing_launched: true`, the
`selection`, each agent's `provider_id` (the group's `matched_connector_service_id`, or null),
`acquisition_url: null`, `coverage_note`, `resolution: previewed` — and hand back to the caller.
Nothing more is printed.

### Example request

Same flow, in a Claude Desktop session where `well_preview_invoice_fetch` **is** available.

### Expected behavior

Call `well_preview_invoice_fetch({ workspace_id })` — the server reads the clicked selection. The
preview card renders the vendors with their checkboxes, its select-all, its Preview badge and its
Deploy action. Do not restate the rows. Say one line per agent — provider, count, nothing started
yet — then the upload line, the connect line, the coverage line carrying the tool's `hints`, one line
asking the user to confirm the vendors and deploy, and the plain sentence that the Well app runs the
collection once the link is open. Carry each agent's `provider_id` and `domain`, plus the envelope's
`acquisition_url`, into the hand-off. End the turn there.

### Example request

"Great, now actually run them."

### Expected behavior

Say plainly that the chat starts nothing, and that Deploy on the card opens the workspace's
collection page for the vendors still ticked, where the Well app runs the fetch. Where no card is
drawn, give the collection link from `acquisition_url`, or `<well-app-base-url>/workspaces/<workspace_id>`
when the preview carried none. Do not call any tool, do not promise a run from the chat, and do not
re-emit the preview as though it were a run.

### Example request

Same flow, tool absent, and the hand-off's `agent_candidates` hold two groups: Amazon with three
counterparties (5 transactions) and `"unknown"` with two counterparties (2 transactions).

### Expected behavior

Build one agent, for Amazon. The `"unknown"` group is not an agent: Well matched no provider for
those rows, so nothing can be dispatched for them. Its 2 transactions become `unmatched_rows`, on a
line of their own rather than folded into `upload_rows`: "Agent ready for Amazon — 5 invoices
(nothing started yet)", then the upload line, then "2 transactions have no provider Well could
identify — no agent covers them", then the connect line, the coverage line, the deploy line, and the
plain sentence that the Well app runs the collection. Never write "Agent ready for unknown".

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

The flow reaches this skill with no `selection` at all — the missing-invoices card is on screen and
the user has ticked nothing yet.

### Expected behavior

Preview nothing. Say the pick comes first, run `show-missing-invoices` so its card takes the tick and
the Continue click, and come back once `selection_state` reads `written`. Do not preview every vendor
of the period as a stand-in for the pick.

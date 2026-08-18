---
name: deploy-agents
description: Preview which invoice-fetching agents Well would launch for a period, and for which providers, counterparties, and transactions — then say plainly that nothing was started. This version is a dry run: it launches no agent, opens no browser session, and queues no task. Use when the user asks to fetch, collect, or chase the invoices they are missing, says "launch the agents", "go get those invoices", "deploy the collectors", or when the fetch-missing-invoices flow reaches its last step after the missing rows have been listed. Do not use to actually run a collection, to invoke a connector's own actions, to create or edit an invoice, to connect a provider, or to list which invoices are missing in the first place.
---

# Deploy Agents with Well

## Purpose

Show what a real invoice fetch would do, before anything is done. Take the rows that are missing an
invoice for one period, group them into the agents Well would launch — one per provider, with the
counterparties and transactions behind each — and state, in the user's language, what would happen:
which agents, which rows the user has to upload by hand, which providers are not connected yet. This
version launches nothing. It is the last brick of Well's fetch-missing-invoices flow and, for now, a
preview of that last brick rather than the launch itself.

## When to use this skill

Use this skill when:

- The user asks Well to fetch, collect, retrieve, or chase the invoices they are missing ("go get
  those invoices", "can you pull the March receipts from Shopify?").
- The user asks to launch, deploy, or start the agents, or asks what would be launched.
- The fetch-missing-invoices flow reaches its last step and its missing rows have already been
  listed.
- The user wants a dry run: "what would you do?", "show me the plan before you run anything".

## When not to use this skill

Do not use this skill when:

- The user wants to know *which* invoices are missing — that is the `show-missing-invoices` skill,
  the step before this one; this skill reads that skill's hand-off rather than recomputing it.
- The user wants an actual collection run, a fetch result, a downloaded file, or a status update on
  a running agent — this version cannot launch, follow, or report on one. Point them to the Well
  app.
- The user wants to connect a provider so it can be fetched from — that is the `connect-tools`
  skill.
- The user wants to create, edit, or attach an invoice by hand — those are Well's invoice skills
  and the Well app, not this one.
- No workspace or no period is pinned — run `define-workspace` and `define-period` first.

## Inputs

The calling skill or the user provides:

- The `show-missing-invoices` hand-off — required in practice. Its rows and its `agent_candidates`
  are what this skill previews. Without it, and without the preview tool below, there is nothing to
  preview: say so and stop.
- `workspace_id` — required. Comes from `define-workspace`; never resolved here.
- `period` — required. Comes from `define-period`, as either `{ calendar_year, calendar_month }` or
  `{ fiscal_year, fiscal_period }`.
- `purpose` — one line from the calling skill, used in the ask when one is needed. Optional.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). Only one tool is
involved, and it is optional:

- `well_preview_invoice_fetch` — **when it is present in your toolset.** Input: the period, as
  `{ calendar_year, calendar_month }` or `{ fiscal_year, fiscal_period }`; pass `workspace_id`
  alongside it, as on every `well_*` call. Output: `period`, `agents` (each with `provider_name`,
  `provider_id` or null, `counterparties` — each `name`, `tx_count`, `base_total_amount` —
  `tx_count`, and `base_total_amount` or null), `upload_rows`, `connect_rows`, `mode: "preview"`,
  `nothing_launched: true`, and `hints`. It is a read: it computes the plan and returns it. In
  MCP-Apps hosts (Claude Desktop, ChatGPT) its result renders one `AgentLaunchedCard` per agent —
  `Agent lancé pour <provider> — N factures`, carrying a **Preview** badge. The card's wording
  is past tense; the fact is not. Say your one line, and stop.
- **When the tool is absent**, no tool call is needed at all. Derive the same preview from the
  `show-missing-invoices` hand-off's `agent_candidates`, which already carry the provider and its
  counterparties. This is the normal path today.

Never call a tool that changes anything. Specifically: no `well_invoke_connector_tool`, no
`well_create_*`, no `well_update_*`, no `well_delete_*`, no connector action of any kind. This skill
reads or derives, and it never writes.

## Workflow

1. **Confirm the MCP server is configured — only if you intend to call the tool.** A run derived
   entirely from the `show-missing-invoices` hand-off calls nothing and needs no check. If you do
   mean to call `well_preview_invoice_fetch` and no `well_*` tool is in your toolset, the Well MCP
   server has not been added to this host: tell the user to add it at
   `https://api.wellapp.ai/v1/mcp`, then fall back to the hand-off if you have one.

2. **Confirm the workspace and the period.** Require `workspace_id` and `period`. If either is
   missing, run `define-workspace` / `define-period` and take their hand-offs; never pin either one
   here. Pass `workspace_id` explicitly on any call you make.

3. **Build the preview.**
   - Tool present → call `well_preview_invoice_fetch({ workspace_id, …period })` and use its
     `agents`, `upload_rows`, and `connect_rows` as they come. Do not recompute or re-sort them.
   - Tool absent → group the hand-off's `agent_candidates` by provider. Each group is one agent:
     `provider_name`, its `counterparties` (each with `tx_count` and `base_total_amount`), the sum
     of their `tx_count`, and the sum of their `base_total_amount` when every row carries one —
     null otherwise. Rows with no fetchable provider are `upload_rows`; rows whose provider exists
     but is not connected are `connect_rows`.
   - No agents, no upload rows, no connect rows → `resolution: nothing_to_do`. Say the period has
     nothing to fetch and stop; do not manufacture a plan.

4. **Say what would be launched — one line per agent, in the user's language.** Read the user's
   language from the conversation, not from the workspace country.
   - Text-only host: write the lines yourself, each naming the provider and the count, each carrying
     the demo-mode suffix. French: `Agent lancé pour Shopify — 3 factures (mode démo : rien n'est
     déclenché)`. English: `Agent launched for Shopify — 3 invoices (demo mode: nothing is actually
     started)`. Name the counterparties only when the user asks or when one agent covers several and
     the names carry the meaning.
   - MCP-Apps host with the tool: the `AgentLaunchedCard`s are already on screen with their Preview
     badge. Do not restate them agent by agent. Say one line — how many agents would run, over how
     many transactions — and stop.
   - The count is a count of **transactions with no invoice attached** — how many invoices an agent
     would go looking for, not how many it would find. Say that once; never present it as a yield.
   - Print an amount only when `base_total_amount` is set. Never print `null`, and never sum across
     currencies that were not already converted to the workspace base currency.

5. **Then the two other lines, always both, even at zero.** One line for the rows the user has to
   upload by hand (`upload_rows`) — no agent can fetch these. One line for the providers that are
   not connected yet (`connect_rows`) — nothing can be fetched from them until they are. State the
   count for each; when the tool returns the rows themselves rather than a count, name at most three
   and give the total. If the user connects a provider or uploads a document and says so, re-derive
   the preview yourself in the same turn and restate it — do not wait to be re-prompted.

6. **State plainly that nothing was started.** One sentence of its own, not a parenthesis: no agent
   was launched, no task was queued, no browser session was opened, and nothing will happen after
   this answer. Say it even when the cards say "Agent lancé". Never claim a launch, a result, a
   downloaded invoice, a success rate, or an ETA — you have none of those, and this version cannot
   produce them.

7. **On failure, redirect instead of guessing.** A transient error on `well_preview_invoice_fetch`
   → retry once. A second failure → fall back to deriving the preview from the hand-off. With
   neither, do not invent a plan: give the user
   `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows the same missing rows
   there. Do not append a query parameter you have not confirmed the app reads.

8. **Hand off.** Emit the hand-off block below and give control back to the caller.

## Output requirements

Return:

- One line per agent, in the user's language, each with the provider, the count, and the demo-mode
  suffix — or, when the preview cards are already on screen, one summary line instead of restating
  them.
- One line for the rows to upload by hand, and one line for the providers still to connect. Both
  lines appear even when the count is zero.
- One plain sentence stating that no agent, no task, and no browser action was started.
- The hand-off block, exactly these keys, so the calling skill can read it:

  ```yaml
  period: { calendar_year: <yyyy>, calendar_month: <1-12> } | { fiscal_year: <yyyy>, fiscal_period: <n> }
  mode: preview
  nothing_launched: true
  agents:
    - provider_name: <name>
      counterparties: [{ name: <name>, tx_count: <n>, base_total_amount: <number or null> }, …]
      tx_count: <n>
      base_total_amount: <number or null>
  upload_rows: <count or rows>
  connect_rows: <count or rows>
  resolution: previewed | nothing_to_do
  ```

  On `nothing_to_do`, `agents` is empty and `upload_rows` / `connect_rows` are zero or empty.
- Connector coverage in plain words: the `connect_rows` line **is** the disclosure. Say which
  providers behind the missing rows are not connected, so the user can tell a full preview from one
  narrowed by what is connected today.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is
  SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. Hand the block back to the caller — the
  `fetch-missing-invoices` flow — with the preview. When the user asks to launch the agents for
  real, say plainly that this version cannot yet and point them to the Well app, which runs the
  fetch itself.

Do not return:

- Any claim that an agent ran, is running, will run, or produced a result — including a percentage,
  a file, or an ETA.
- The per-agent rows restated under the preview cards that already show them.
- A `null` amount printed as a number, or amounts summed across currencies.
- An agent for a provider that is not in the preview or in `agent_candidates`.

## Quality checks

Before finishing, verify:

- No write tool was called: no `well_invoke_connector_tool`, no `well_create_*`, no
  `well_update_*`, no `well_delete_*`, no connector action.
- `workspace_id` and `period` came from `define-workspace` / `define-period` (or the caller) and
  neither was resolved here.
- The preview came from `well_preview_invoice_fetch` when it exists, and from the
  `show-missing-invoices` hand-off's `agent_candidates` when it does not — never from a guess about
  which providers a workspace uses.
- One line per agent, in the user's language, each carrying the demo-mode suffix — or one summary
  line when the cards are on screen, with no agent-by-agent restatement.
- The upload line and the connect line are both present, even at zero.
- The answer contains one plain sentence stating that nothing was launched, queued, or opened.
- No launch, result, yield, or ETA is claimed anywhere, including under the card's "Agent lancé"
  wording.
- Counts are described as transactions missing an invoice, not as invoices already found.
- Amounts appear only when set, and never mix currencies.
- After a connection or an upload landed, the preview was re-derived in the same turn.
- On a transient tool failure the call was retried once, then the hand-off was used, then the
  workspace link — in that order.
- The hand-off block carries every key with `mode: preview`, `nothing_launched: true`, and
  `resolution` set.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the hand-back to the caller, and any request to really launch was answered
  with the Well app rather than a promise.

## Examples

### Example request

The fetch-missing-invoices flow calls deploy-agents with `workspace_id` of Acme SAS,
`period: { calendar_year: 2026, calendar_month: 3 }`, and the `show-missing-invoices` hand-off:
`agent_candidates` covering Shopify (3 transactions, 1 counterparty), Free Pro (2 transactions),
plus 4 rows with no provider and 1 row on an unconnected Stripe account. The user writes in French.
`well_preview_invoice_fetch` is not in the toolset.

### Expected behavior

Derive the preview from `agent_candidates`; call nothing. Answer:

> Agent lancé pour Shopify — 3 factures (mode démo : rien n'est déclenché)
> Agent lancé pour Free Pro — 2 factures (mode démo : rien n'est déclenché)
> 4 lignes sont à téléverser à la main : aucun agent ne peut aller les chercher.
> 1 ligne dépend de Stripe, qui n'est pas encore connecté.
>
> Aucun agent n'a été lancé, aucune tâche n'a été mise en file, aucune session de navigation n'a été
> ouverte. Ces chiffres comptent les transactions sans facture, pas les factures déjà récupérées.

Then the hand-off block with `mode: preview`, `nothing_launched: true`, `resolution: previewed`, and
the hand-back to the caller.

### Example request

Same flow, in a Claude Desktop session where `well_preview_invoice_fetch` **is** available.

### Expected behavior

Call `well_preview_invoice_fetch({ workspace_id, calendar_year: 2026, calendar_month: 3 })`. The
`AgentLaunchedCard`s render with their Preview badge. Do not restate them. Say one line — "2 agents
would run, over 5 transactions missing an invoice" — then the upload line, the connect line, the
plain no-launch sentence, and the block. Stop there.

### Example request

"Great, now actually launch them."

### Expected behavior

Say plainly that this version previews only and cannot launch an agent, then point to the Well app,
where the fetch itself runs: `<well-app-base-url>/workspaces/<workspace_id>`. Do not call any tool,
do not promise a launch later in the conversation, and do not re-emit the preview as though it were
a run.

### Example request

The flow calls deploy-agents for a period whose rows all already have an invoice attached —
`agent_candidates` is empty and there is nothing to upload or connect.

### Expected behavior

Return `resolution: nothing_to_do`: "Nothing to fetch for March — every transaction already has its
invoice." Emit the block with an empty `agents` list, and hand back. Do not invent an agent, and do
not offer to launch one anyway.

---
name: define-workspace
description: Resolve which Well workspace (legal entity / company account) a conversation works in, and hand it off as a typed result — workspace_id, name, identity, and how it was resolved — to any Well skill or flow that follows. Use when the user asks to select, choose, switch, or confirm a workspace, says "use my FR entity" / "work in workspace X" / "which company account is this", or when a Well skill needs one workspace pinned before it reads or writes data. Resolves several entities too — "do both my companies", "FR and US" — as a pin plus a server-held queue the caller walks one workspace per pass. Do not use to connect a bank or accounting tool, to compute any financial figure, or to confirm the company identity inside the Well app.
---

# Define Workspace with Well

## Purpose

Pin exactly one Well workspace at a time for the rest of the conversation. Read the workspaces this connection is authorized on, resolve a single one — automatically when there is one, from the user's hint when it matches, or from the user's **click on the picker card** otherwise — and carry the result forward so every later `well_*` call reuses its `workspace_id`. The card's **Use** button writes the choice server-side and prefills a confirmation — "Continue in <name>" — in the user's composer; the user sends it, and that message is how the skill resumes. When the user picks several tiles, that is still one click: the first workspace is pinned and the rest wait in the session's `workspace_queue`, which the caller walks one full pass per entity — never a merged view. This is the first brick of Well's fetch-missing-invoices and close-books flows.

## When to use this skill

Use this skill when:

- The user asks to select, choose, switch, or confirm a workspace ("use my US entity", "work in the Acme workspace", "which company account am I in?").
- A Well skill or an orchestrating flow (fetch missing invoices, close the books, connect tools) needs one workspace resolved before it continues.
- A Well tool answered `WORKSPACE_REQUIRED` or fanned out across several workspaces and the user needs to pick one.
- The user manages several legal entities in Well and it is unclear which one a request is about.
- The user names or picks several entities for one job ("do both my companies", "FR and US", "run it on all three") and the flow that follows has to walk them one at a time.

## When not to use this skill

Do not use this skill when:

- The user wants to connect a bank, accounting tool, or invoicing portal — that is the `connect-tools` skill (the next brick of the flow), or `connect-bank` for a bank-only ask, when they are installed.
- The user wants a number (runway, cash, expenses) — the data skills (`runway`, `cash-position`, `cost-structure`, …) already run this step internally; use them directly.
- The user wants to confirm or edit the company behind a workspace (registered name, tax id, child entities) — that happens in the Well app, not here.
- The user wants to create a workspace — Well's OAuth / sign-in flow creates the first workspace; this skill only reads what already exists.

## Inputs

The user or the calling skill may provide:

- A workspace hint: a `workspace_id`, a workspace name, or the company name behind it. Optional.
- A `purpose` line from the calling skill (e.g. "to fetch the invoices missing for March") so the card-pointing line, if one is needed, says why. Optional.

Nothing is required. With no hint and one workspace, the skill resolves silently.

## Tooling

This skill runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_workspaces` — the read this skill is built on. Takes no input; returns `workspaces[]` with `workspace_id`, `workspace_name` (nullable), `is_primary` (the token's default workspace), `has_bank_transactions`, and `identity` (`registered_name`, `trade_name`, `registered_value`, `country`, `domain`, `base_currency`, `fiscal_year_start_month` — every field null until the workspace has accounting settings). `has_bank_transactions` is the workspace's bank signal, and it is tri-state: `true` says a connector the workspace banks with has delivered a transaction to it, `false` says none was found, and `null` says the signal could not be read. An accounting platform and a payment processor deliver transactions too and count for neither value. Hand it on: a caller's bank step reads it before any month read, and `false` is the only value that says the workspace banks with nothing. An absent value is not a zero, and no value of it licenses skipping a bank-connection step. The result also carries `session: { pinned_workspace_id, workspace_queue, selected_periods }` — the connection's server-held context. Desktop-class hosts keep ONE MCP session per connector, shared across all conversations, so at conversation start these values may be another conversation's leftovers — stale by definition. Trust the session block only for a choice THIS conversation established (its own card click or typed answer); use it to resync after a stop inside this conversation, never to skip a picker. In MCP-Apps hosts (Claude Desktop, ChatGPT) the result renders as an interactive workspace picker card whose tiles are multi-select. The tool withholds that card when it returns exactly one workspace, so the one path that asks nothing draws nothing.
- `well_switch_workspace` — pins one workspace as this connection's standing default. It also accepts `workspace_ids` (a list: the first is pinned, the rest become the session's `workspace_queue`), `periods` (the period card's field), and `ack` (the connect cards' field) — it is the same tool the widget cards call on their **Use** / **Validate** / **Continue** clicks, so a click has already written the session context by the time its prefilled message arrives. Call it yourself only for a typed answer or a matched hint; never call it again for a pick the card made. The pin is a default, not a permission: it only chooses among the workspaces the connection is already authorized for and grants no new access. If the tool is absent, the Well server predates it — resolve the workspace as usual and rely on the explicit `workspace_id` argument alone.
- `well_wait_for_selection({ kind, timeout_s? })` — reads the click the user made on the picker card, for when a later message is not the card's prefill. Call it only after this conversation has rendered the picker: reading a click on that card is its one job. Never call it at step start, never before the picker exists, and never to probe whether a workspace is already pinned — a trusted pin lives only in this conversation's own history (a prior click, prefill, or typed choice). A fresh conversation trusts no session state — a value present at its start is another conversation's leftover; when the workspace is unresolved and no picker has been rendered yet, render the picker at once — no tool call comes before it except the render itself. With `kind: "workspace"` an already-made click returns instantly as `{ status: "selected", selection: { workspace_id, workspace_queue }, already_set: true }`; when nothing is set yet it waits briefly (default 10 seconds) and returns `{ status: "no_selection_yet" }` — a normal result, not an error. Never call it in the turn that renders the picker, and never use it as a long wait. If the tool is absent, resync from `well_list_workspaces`' session block instead.
- Well's OAuth / Dynamic Client Registration (DCR) flow, or the Well connector's `authenticate` tool if the host exposes one — when no Well connection exists yet.

The pin is a convenience, never the contract. Pass `workspace_id` explicitly on every call that follows, pinned or not — belt and braces, so one skill in a chain that forgets the argument cannot silently read a different entity.

## Workflow

Call each list or read tool once per step, and render one widget card per turn, which is always the card carrying the turn's question. The cards refresh themselves. A card click executes server-side and prefills a message in the user's composer, so the card that carries the turn's question ends the turn, and the sent message is how the skill resumes. **Nothing continues past a card in the same turn.** One account asks nothing about the workspace at all, the one holding exactly one workspace: `well_list_workspaces` withholds the picker there, because a chooser over a set of one has nothing to choose, so step 3 names the entity in one line and the caller continues in the same turn. This sentence is the governing rule, so that path is stated here rather than left to be inferred from the step that owns it.

1. **Confirm the MCP server is configured.** If `well_list_workspaces` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because the workspace list comes from Well and nothing can be resolved without it. Stop until it is there.

2. **Read the workspaces.** Call `well_list_workspaces()`.
   - Auth error → no Well connection yet: start the Well connector's OAuth/DCR flow. The moment it returns, retry `well_list_workspaces()` yourself in the same turn and continue — do not ask the user to confirm they signed in.
   - `success: false` with a non-auth error → retry once; if it fails again, go to step 6.
   - Zero workspaces → the account has no workspace yet. Say so, point the user to Well to finish signing up, and return `resolution: unresolved`.
   - `session.pinned_workspace_id` set, and THIS conversation established it (its own picker click or typed choice earlier in the conversation), and the user is not asking to pick or switch → use it silently. Map it to its row, set `resolution: user_picked`, and go straight to step 7 — never re-ask a choice this conversation already made. A non-empty `session.workspace_queue` alongside it means that multi-pick is mid-walk: hand off `multi_picked` with the pin first and the queue behind it.
   - `session.pinned_workspace_id` set, but this conversation never rendered the picker nor took a typed choice → the value is another conversation's leftover. Ignore it and resolve as if it were unset (steps 3–4). Never mention it — "already pinned" / "already recorded" is forbidden phrasing — and never skip the picker because of it; the user's fresh click or typed choice overwrites it server-side.

3. **Resolve without asking when you can.**
   - Exactly one workspace → use it. `resolution: single`. Say which one in one line; do not ask for confirmation and do not call `well_switch_workspace` — with one authorized workspace there is nothing to choose between. The read withholds the picker here, so no card is drawn: point at none, wait on none, and let the caller continue in the same turn. An older server that still draws the picker changes nothing, because nothing was asked on it.
   - Several workspaces and a hint → match the hint exactly on `workspace_id`; otherwise case-insensitively on `workspace_name`, `identity.registered_name`, `identity.trade_name`, or — for a country hint such as "my US entity" — on `identity.country` (ISO code). Exactly one match → use it, `resolution: hint_matched`, say which one you matched, and call `well_switch_workspace({ workspace_id })` so a later call cannot fall back to a sibling entity. A failed or absent switch is not a stop — continue on the explicit argument. Zero or several matches → fall to step 4; never pick the closest name.
   - **A hint that names several entities** ("FR and US", "Acme SAS and Acme Inc.", "both my companies") is a sequence, not an ambiguity. Split it into its fragments, match each one exactly as above, and keep the user's order. Every fragment matching exactly one workspace, and at least two distinct workspaces matched → call `well_switch_workspace({ workspace_ids: [...] })` once, in that order — the first is pinned, the rest become the session's `workspace_queue` — and set `resolution: multi_picked`. Every fragment resolving to the same single workspace → one entity, `resolution: hint_matched`. Any fragment matching zero or several workspaces → fall to step 4 and let the user pick; never resolve part of a compound hint and drop the rest silently.

4. **Otherwise, end the turn on the card.** The `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select, the token's default marked). Do not restate the workspaces under it and do not ask "which workspace?" in text — the card is the question. End the turn with one short line that **names the entities**: "pick the workspace on the card, Acme Inc. (US) or Acme SAS (FR), then send the message it prepares". Naming them inline is not the restated list this step forbids, and it is what makes the line survive a host that drew no card: you cannot tell which host you are in, so the sentence has to carry the options either way. Use `purpose` to say why when the caller gave one. Nothing else in the turn.
   - The **Use** click pins the choice server-side and prefills "Continue in <name>" in the composer; a multi-tile pick prefills "Continue in <first> — then <n2>, <n3>". The user sends it with Enter.
   - In a text-only host (no cards, and usually no wait tool), list each workspace on one line — name, country, base currency, "(default)" on the primary — and ask one line. This is the only host where a typed question stands in for the picker.
   - Do not default to the primary workspace on the user's behalf. `is_primary` is a fact to display, not a choice to make.

5. **Resolve the next message after the card.** In this order, and never by re-asking:
   - The message is the card's prefill ("Continue in <name>", or the multi form with "— then …") → the click already pinned the workspace and queued the rest server-side. Acknowledge in half a sentence and continue — never re-verify with an extra tool call what the prefill already states, and never call `well_switch_workspace` for it. Map the names back to rows in the earlier result. A single name → `resolution: user_picked`; the multi form → `resolution: multi_picked`.
   - The message names or describes one or more workspaces in its own words → a typed pick. Map each name to its `workspace_id` from the earlier result — never a guessed id — then call `well_switch_workspace({ workspace_id })` yourself, or `well_switch_workspace({ workspace_ids: [...] })` for several in the user's order. `resolution: user_picked` or `multi_picked`. A name matching zero or several rows is asked about, never guessed.
   - The message declines ("later", "not now", "skip it") → `resolution: unresolved`. Say nothing was pinned and stop; do not call `well_wait_for_selection`, and do not run any workspace-scoped call. Read a decline before the branch below, so a "later" never becomes a wait call.
   - Any remaining message that needs the workspace → call `well_wait_for_selection({ kind: "workspace", timeout_s: 10 })` once. `selected` (fresh or `already_set`) → the click landed; continue on `selection.workspace_id` — an empty `selection.workspace_queue` is `user_picked`, a non-empty one `multi_picked`. `no_selection_yet` → one line asking to click the card, end the turn.

6. **On failure, redirect instead of guessing.** If `well_list_workspaces` fails twice, do not invent a workspace. Tell the user, and give them `<well-app-base-url>` to open Well directly — signing in lands them in their workspace. Do not append a path or query parameter you have not confirmed the app resolves.

7. **Hand off.** Restate the resolved workspace in one line and keep the hand-off facts below for the skills that follow — carried in the conversation's plain prose, never printed as a block. From here on, pass `workspace_id` explicitly on every `well_*` call, whether or not a pin is in place. A pin changes what an omitted argument falls back to; it does not make the argument optional.

**Several workspaces — the loop rule.** `multi_picked` is a pin plus a server-held queue, and the caller processes one workspace at a time: it runs its whole walk on the pinned workspace first, then calls `well_switch_workspace({ workspace_id: <next> })` on the next queue entry and repeats, reading the queue from `well_list_workspaces`' `session.workspace_queue` rather than from anything said in chat. Each pass passes its own `workspace_id` explicitly on every call and gets its own recap. Nothing is merged across two entities: no shared row, no combined total, no coverage line spanning both. A stop or a skip inside one pass ends that pass only; the remaining workspaces still run. State this rule in one line when you hand off a `multi_picked` result.

## Output requirements

Return:

- One line naming the pinned workspace with its `identity.country` and `identity.base_currency` when set (e.g. "Working in **Acme SAS** (FR, EUR)."). When identity fields are null, say the workspace has no accounting settings yet rather than printing nulls. On `multi_picked`, one line naming the sequence in order and the entity the first pass runs in, plus one line of the loop rule. Past three or four entities, name them without their identity — the line stays a sentence, not the list the card already shows.
- The hand-off, kept for the skills that follow and never printed: `workspace_id`, `workspace_name`, `is_primary`, `has_bank_transactions` for the pinned workspace, the identity fields (`registered_name`, `trade_name`, `country`, `base_currency`, `fiscal_year_start_month`), and `resolution` — one of `single`, `hint_matched`, `user_picked`, `multi_picked`, `unresolved`. On `multi_picked`, also keep `workspaces`: the pinned entry first, then the queue entries in order, each with the same fields — and remember the queue itself lives server-side in `session.workspace_queue`, where the caller re-reads it between passes. On `unresolved`, nothing is kept. These keys are reasoning vocabulary for you and the calling flow, which routes on `resolution`; the hand-off travels as plain conversation, not as a data block.
- Keep passing `workspace_id` explicitly on every following `well_*` call. On `multi_picked` that rule is per pass: the `workspace_id` of the workspace the current pass is walking, never a mix of two.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `connect-tools` skill is installed: "Is a bank and an accounting tool connected to this workspace?". On `multi_picked`, ask it about the first entity and say the same walk repeats for the next one. Otherwise hand control back to the skill that called this one, or, when the user asked for the workspace on its own, ask what they want to do in it.
- The whole answer stays one to three plain sentences a non-technical user understands: which workspace is now in use, and what happens next. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- A restated list of the workspaces when the picker card is already on screen, or a text question "which workspace?" in a host that renders the card.
- A workspace chosen by similarity or by `is_primary` when the user did not pick it.
- Workspace-scoped data — records, figures, connections — read from any workspace other than the one the current pass is pinned to. Naming the queued entities and their identity in the `multi_picked` hand-off line is not that; it comes from the picker list, not from a second workspace's data.
- A `multi_picked` hand-off presented as a wider scope, a merged view, or a single pass over several entities.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the pinned workspace in text regardless — you cannot know whether anything drew it. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- After an OAuth/DCR flow, `well_list_workspaces()` was retried in the same turn.
- `session.pinned_workspace_id` was trusted only when this conversation established it; a value present at conversation start was ignored and never mentioned, and the picker rendered anyway.
- Exactly one workspace is pinned, or `resolution: unresolved` is returned — never two at once, never a merged view. A multi-pick is one pin plus the server-held queue, walked one entity at a time.
- A hint resolved only on an exact id or a case-insensitive name match with exactly one hit.
- With several workspaces and no hint, the picker rendered and the turn ended with one card-pointing line; in a host that renders the card, no text question replaced it, and no wait tool was called in that turn — or in any turn before the picker existed. In a text-only host, the one-line-per-workspace list and its single question stand in for the picker, as step 4 allows.
- With exactly one workspace, nothing was asked: the read withheld the picker, no line pointed at a card, no wait tool ran, and the answer named the entity in one line so the caller could continue in the same turn.
- `has_bank_transactions` for the pinned workspace travelled in the hand-off, with `null` and an absent field kept apart from `false` rather than reported as a workspace that banks with nothing.
- `well_switch_workspace` was called exactly once on `hint_matched` and a typed single pick, once with `workspace_ids` on a compound hint or typed multi-pick, and not at all for a pick the card made (the click already called it), on `single`, or on a decline. A failed or absent switch did not stop the skill.
- The `workspace_id` in the hand-off comes from the `well_list_workspaces` result the pick was read against.
- After the card, a prefill message was taken at its word with no extra verification call; any other message that needs the workspace got one `well_wait_for_selection({ kind: "workspace", timeout_s: 10 })` call; a decline got none; nothing was re-asked in text. `well_wait_for_selection` was called only after this conversation rendered the picker — never as a pin probe.
- The hand-off facts were kept with `resolution` set, and no yaml, JSON, or fenced code block appears anywhere in the answer.
- Only `multi_picked` kept a `workspaces` list, its first entry the pinned workspace, and the loop rule was stated in one line.
- Each list or read tool was called once per step; on a transient failure the call was retried once before the fallback link.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`connect-tools` when installed, otherwise the caller or a question).

## Examples

### Example request

"Fetch the invoices I'm missing for March." (calling skill invokes define-workspace with `purpose: "to fetch the invoices missing for March"`; the connection covers one workspace)

### Expected behavior

Call `well_list_workspaces()`, get one workspace, and continue without asking: "Working in **Acme SAS** (FR, EUR)." The read withholds the picker, so no card appears and no line points at one. Keep `resolution: single` and the workspace's `has_bank_transactions` for the flow — nothing more is printed.

### Example request

"Show me my runway." (the connection covers Acme SAS and Acme Inc.; no hint, no session pin)

### Expected behavior

The picker card renders on the tool result. End the turn with one line: "Pick your workspace on the card, then send the message it prepares." The user clicks **Use** on Acme Inc. and sends the prefilled "Continue in Acme Inc.": the click already pinned it server-side. Answer "Working in **Acme Inc.** (US, USD)." and continue with `resolution: user_picked` — no switch call, no verification read, no restated list.

### Example request

Same picker, but the user's next message is "ok go on" instead of the prefill.

### Expected behavior

Call `well_wait_for_selection({ kind: "workspace", timeout_s: 10 })` once — the click landed before they typed, so it returns the selection with `already_set: true`; continue on it without re-asking. Had it returned `no_selection_yet`, one line asking to click the card ends the turn.

### Example request

"Fetch the invoices I'm missing for March in both my entities." (the connection covers Acme SAS and Acme Inc.)

### Expected behavior

The compound hint matches both. Call `well_switch_workspace({ workspace_ids: [<acme-sas-id>, <acme-inc-id>] })` — Acme SAS is pinned, Acme Inc. waits in the session's `workspace_queue`. Answer "Working through **Acme SAS** (FR, EUR), then **Acme Inc.** (US, USD). Starting with Acme SAS. I walk one entity at a time and keep their figures apart." and keep `resolution: multi_picked`. Had the user clicked both tiles instead, the one **Use** click writes the same pin and queue and prefills "Continue in Acme SAS — then Acme Inc."; the sent message carries the pick — same hand-off, no extra switch call.

### Example request

"Use my US entity for this."

### Expected behavior

Match "US" against `identity.country`. Exactly one workspace with `country: "US"` → call `well_switch_workspace({ workspace_id })` to pin it, say "Working in **Acme Inc.** (US, USD).", and keep `resolution: hint_matched`. Two US workspaces, or none with a country set → do not guess: the picker is on screen; end the turn on it as in step 4.

### Example request

The user answers "later" after the picker card ended the turn.

### Expected behavior

Return `resolution: unresolved`, say no workspace was pinned, and stop — do not call `well_switch_workspace`, do not fall back to the default workspace, and do not run any workspace-scoped read.

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

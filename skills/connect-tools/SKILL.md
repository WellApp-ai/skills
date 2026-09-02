---
name: connect-tools
requires: [define-workspace]
description: Check which data sources a Well workspace has connected — bank accounts, accounting software, invoicing and payment portals — get the missing ones connected with Well's one-click install links, and hand off a typed coverage result to the flow that follows. Use when the user asks to connect a bank, connect their finance tools, link an accounting tool (Pennylane, QuickBooks, Xero…), add Stripe or Shopify, asks "which tools are connected", "what can I connect to Well", or when a Well skill needs bank / accounting / invoicing data present before it continues. Do not use to compute figures, to trigger a sync, to disconnect a tool, or to run a connector's own actions.
---

# Connect Tools with Well

## Purpose

Answer "does this workspace have the connections this job needs?" and close the gap. One tool does the whole job: `well_list_connectors` returns Well's connector catalog with every one of the workspace's connections represented on its own catalog row, and in an MCP-Apps host that result renders as the connect picker card. Read the state per kind — bank, accounting, invoicing — from those rows, let the card carry the connect links, and hand a typed coverage result to the calling flow. In `flow_step` mode — the default, and what a run made for its own sake gets — this is **a user stop**: the card renders — green or not — as a multi-select picker. In `internal_check` mode it is not a stop at all; the caller asked for coverage, not for a connect step, and the read hands back in the same turn. The tiles tick on and off, and the `is_preselected` rows arrive pre-checked. One **Connect** button opens an install tab per ticked provider, and one **Continue** button ends the step. The Continue click writes an acknowledgment server-side (`well_switch_workspace` with `ack: "connectors"`) and prefills "Continue" in the user's composer; the user sends it, and that message is how the flow moves on. On a run scoped to `kind` `bank` — the bank-only fallback below, for when `connect-bank` is not installed — the result reports that scope. The card takes its wording and its ack kind from that field, so it writes `ack: "bank"` instead. In Well's fetch-missing-invoices flow it runs at the connect step for the vendors the user picked, after the gap list, and again as the bank-only fallback above where `connect-bank` is not installed.

**The card names its own scope.** A call scoped with `kind` gets that scope's wording — the bank, the accounting tool, or the invoicing tool by name — and an unscoped call keeps the generic wording for the whole catalog. Both states carry the workspace attribution strip, so the user sees which workspace they are connecting. Say the scope in your own line too, and never restate the card's title. A calling flow that wants the card to read as part of *its* step — a close, say, rather than a generic connect prompt — passes `title` / `subtitle` to override that default wording; the card falls back to the scope-derived wording when they are absent or the tool does not accept them.

**Entering this step means calling `well_list_connectors`.** Whatever asks for a connect step — a user, a calling flow, or a missing-invoices pick that names connectors Well already carries — the step is that call, and the turn ends on its result. In an MCP-Apps host the result renders the card. **Naming connectable rows from memory, or from another read, and moving to the next step is the failure this rule names**, not a shorter path to the same place. The result carries install links — one batch link where it has one, and the rows' own otherwise — so a text-only host still closes the gap through the branch in step 4, but only on the rows this call returned.

**One card, and the result names the scope it is showing.** `well_list_connectors` takes `kind` (one financial domain), `q` (one name search), or `from_selection: true` (the connectors behind the counterparties the user picked on the missing-invoices card this session, every one that is not already connected pre-checked). `from_selection` cannot be combined with `kind` or `q` — the tool rejects that call. `kind` and `q` do combine, to search inside one domain. Every result reports `scope` — `"catalog"`, one of the three domains, or `"picked_vendors"` — and the card titles itself from that field, so its wording describes the rows it is showing rather than the call that asked for them. `q` sets no scope of its own: a name search still reports `scope: "catalog"`, and the card keeps the catalog wording, so say in your own line that those rows are a search result.

Reach for `from_selection: true` when the user has already chosen the vendors: a card that offered the whole accounting catalog there would ask them to make a decision they already made. Reach for `kind` when the choice is still open. There is no way to narrow the catalog scopes to an arbitrary list of `service_id`s. `q` is the only narrowing they have, and it searches on name: a term specific enough to return the connectors you mean is how a catalog result comes back as the set your answer names. A caller holding specific services otherwise arrives through the pick, or makes one unscoped call and names those services in its own line.

## When to use this skill

Use this skill when:

- The user asks to connect an accounting tool or an invoicing / payment portal to Well ("link Pennylane", "add Stripe so you can pull invoices"), or to connect their tools in general.
- The user asks what is connected, what is still syncing, or why a source shows an error.
- A calling skill (fetch missing invoices, close the books, a data skill) needs bank, accounting, or invoicing data in the workspace before it can continue.
- A vendor pick names a service Well already holds a connector for — the missing-invoice flow reaches this step whenever a picked counterparty carries a `matched_connector_service_id`, so the user can connect it instead of running a browser agent for it.
- A data skill found the workspace empty or thin and needs the user to connect a source.

## When not to use this skill

Do not use this skill when:

- The workspace is not resolved yet — run `define-workspace` first and pass its `workspace_id` in.
- The ask is only about the bank ("connect my Qonto", "is my bank connected?") **and** the `connect-bank` skill is installed — it scopes the catalog to banks and returns one state instead of three. When it is not installed, answer here instead: scope this run to `kinds: [bank]` rather than sending the user to a skill they do not have.
- The user wants a figure (cash, runway, spend) — the data skills run this check internally, passing `mode: internal_check`, which reads coverage and returns in the same turn. Do not invoke this skill standalone for that.
- The user wants to disconnect a tool, force a re-sync, or run an action on a connected provider (`well_invoke_connector_tool`) — out of scope; point them to the Well app.
- The user wants Well to fetch invoices from a portal — that is the deploy-agents step of the flow, after this one. That step opens the collect page in the Well app for the portals the user picked, and the Well browser extension collects from them once the user starts it there.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; do not resolve the workspace here. Reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace`.
- `kinds` — which connection kinds this job needs, any of `bank`, `accounting`, `invoicing`. Default: all three. When the user's own question names one kind ("is my accounting connected?"), treat that as the scope even with no calling skill involved.
- `required` — the subset of `kinds` the calling flow cannot continue without. A missing required kind at the acknowledgment stops the flow instead of continuing. Default: none.
- Provider hints — names the user mentioned ("Qonto", "Pennylane", "Shopify"). Optional; used to search the catalog.
- `mode` — `flow_step` (default) or `internal_check`. `flow_step` is a run made for its own sake: the user asked to connect something, or a flow reached its connect step. It renders the card and ends the turn on the acknowledgment. `internal_check` is a data skill reading coverage on its way to a figure — it returns the hand-off in the same turn and never stops. Absent means `flow_step`: a caller that has not said which it wants gets the safe one, because a stop the caller did not want costs a round-trip, while a missed stop loses the user's chance to connect what is missing.
- `purpose` — one line from the calling skill (e.g. "to fetch the invoices missing for March"), used in the ask. Optional.
- `title` / `subtitle` — copy for the connect card, so a calling flow can adapt the wording to its own step (e.g. a close: "Connect your accounting tool for the close"). Optional; pass straight through to `well_list_connectors` when it accepts them, and fall back to the scope-derived wording otherwise. Never restate them in your own line.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's `workspace_queue` (read from `well_list_workspaces`' `session` block) name the sequence, and this skill always works on the currently pinned workspace only. The caller re-pins with `well_switch_workspace({ workspace_id })` between passes; each pass gets its own coverage read and its own acknowledgment, and nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry.

**Composed skills.** One atomic Well skill owns the step before this one — invoke it, don't reimplement it:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there is no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every call here carries.

It ships with the `well-skills` plugin. This skill is also installable on its own, so step 2 carries an inline fallback for when `define-workspace` is absent. Outside that fallback this skill does not resolve the workspace itself: when no `workspace_id` was passed and this conversation established no pin, run `define-workspace` first (step 2) rather than asking for a workspace here.

**`well_list_connectors` is the only connector-listing tool this skill calls**, and the one read that decides coverage. The `well_list_workspaces` session read below is the sole exemption. It returns the connectable catalog with a live overlay: every connection the workspace already holds is represented on its own catalog row, so one call answers both "what can I connect?" and "what is connected?". For the full field-by-field breakdown of a catalog row, the catalog-paging caveat that can make a live connection look missing, and the older-server fallback, read `references/connector-catalog-fields.md`.

Beside the rows, the result also carries `install_all_url` (a single link that installs every installable row in one tab) and `install_all_omitted` (the rows it could not fit). For when `install_all_url` is the right offer versus each row's own `install_url`, read `references/install-links.md`.

Inputs to `well_list_connectors`: `kind` — one of `bank`, `accounting`, `invoicing` — filters the catalog to that kind server-side and picks the card's wording. When the job covers exactly one kind, pass `kind`; when it covers two or three, make **one unscoped call** grouped by `data_domains` — one call renders one card, and a turn never renders two. An unscoped call gets the generic wording, so name the three kinds in your own coverage line. A run that follows a vendor pick passes `from_selection: true` instead — see Purpose. `q` name-searches the catalog, and narrows to one domain when it rides with `kind`. `limit` and `offset` page it. `title` / `subtitle`, when the tool accepts them, override the card's scope-derived wording so a caller can name its own step; pass them straight through and let the card fall back to the default when they are absent.

The click-chain tools:

- `well_wait_for_selection({ kind: "connect_ack", timeout_s? })` — reads the Continue click (the card calls `well_switch_workspace` with `ack: "connectors"` itself), for when a later message is not the card's "Continue" prefill. **On a run scoped to `kind` `bank`, read the click back with `kind: "bank_ack"` instead**: that card writes `ack: "bank"` to a separate field, and a `connect_ack` read never sees a bank card's click. Call it only after this conversation has rendered the connect card — never at step start, never to probe for an ack. An already-made ack returns instantly as `{ status: "selected", selection: { acknowledged: true }, already_set: true }`; when nothing is set yet it waits briefly (default 10 seconds) and returns `{ status: "no_selection_yet" }`, a normal result, not an error. A session holds one ack per step; step 5 covers how a second connect card in the same conversation is verified instead.
- `well_list_workspaces` — the one exemption from the connector-listing rule above, with two narrow uses: resyncing this conversation's own state after a stop (its `session` block carries the pinned workspace and the `workspace_queue` a multi-workspace run walks), and resolving the workspace in step 2's inline fallback when `define-workspace` is not installed. It never contributes to the coverage decision, and outside that fallback it never resolves a workspace this conversation did not pin.

**Never call `well_query_records` on `workspace_connectors` in this skill.** That root is for record-level reads — timestamps, filters, joins — and querying it here renders a records table where the connect picker belongs, which is the wrong surface for a connect step and does not carry an install link. Everything this skill needs is on the catalog row.

**How a kind is decided — exact-match on structured fields, never on a name or a category label.** A row counts toward a kind only when its `direction` is `input` and its `data_domains` contains that kind's value: `bank`, `accounting`, or `invoicing`. `category_id` is not a reliable kind (native banks such as Qonto sit under `finance`; only Plaid institutions carry `banks`), and a display name is never a kind. When you pass `kind`, the server has already applied this filter — still drop any `direction: output` row from the coverage decision.

**How a row's state is read**, in this order — the first line that matches wins:

1. `to_configure` or `disabled` → **missing.** Never authorized, or turned off. Offer the install link — a missing row is what a batch install link covers.
2. `need_reconnect`, `error`, or `suspended` → **error.** Authenticated but not delivering data; offer `install_url` as a reconnect. That reconnect is always this row's own link, never the batch one. A row that once synced and now needs a reconnect is an error, not coverage — a stale feed is exactly what this skill exists to surface.
3. `enabled` with `last_successful_sync_at` set → **connected.** Data has landed.
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting.** The grant is in and the first sync is running.

`sync_in_progress: true` on a **connected** row keeps it connected — say data may be partial until the pass finishes.

## Workflow

Call each list or read tool once per step. In `flow_step` mode render at most one widget card per turn — the cards refresh themselves and a second one competes with the picker for the click the step is waiting on.

In `internal_check` that invariant does not hold and cannot: `well_list_connectors` is a UI tool, so an MCP-Apps host draws the picker whenever the coverage read runs, and the calling data skill then draws its own result card in the same turn. Two cards is the cost of reading coverage inline; the alternative is the turn boundary this mode exists to remove. Do not add a third — the coverage read and the caller's own answer are the two, and nothing else in that turn renders. The cards refresh themselves. The Continue click executes server-side and prefills "Continue" in the user's composer — rendering the card therefore ends the turn, and the sent message is how the flow moves on.

1. **Confirm the MCP server is configured.** If `well_list_connectors` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because connections are made and tracked in Well. Stop until it is there.

2. **Confirm the workspace.** Require `workspace_id`. If the caller did not pass one, use the session pin silently when this conversation established it; otherwise run `define-workspace` (its picker renders at the point of need — never ask "which workspace?" in text, and never reuse or mention a pin left by another conversation). Pass `workspace_id` explicitly on every call below, even under a session pin.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

3. **Read the current coverage in one call.** `well_list_connectors({ workspace_id, from_selection: true })` when this run follows a vendor pick, `well_list_connectors({ workspace_id, kind })` when the job covers exactly one kind, `well_list_connectors({ workspace_id })` otherwise. The result renders the connect picker card. On a `kind`-scoped or unscoped call, keep the `direction: input` rows, group them by `data_domains`, and read each row's state with the precedence in Tooling. Per requested kind:
   - At least one **connected** row → **connected**. Add "data may still be partial" when that row has `sync_in_progress: true`. Name any **error** row for the same kind alongside it and carry that row's own `install_url` as a reconnect — one live connector does not cancel a dead one, and only the user knows whether the dead account matters.
   - Only **connecting** rows → **connecting**. Treat as connected for the flow; tell the user data may be partial for a few minutes.
   - Only **error** rows → **error**. Name the connector and offer its `install_url` as a reconnect, not a first install.
   - No qualifying row → **missing**, including a `to_configure` row the user started but never finished authorizing. A missing kind is what `install_all_url` closes where the result carries one.
   - **A `from_selection` result carries every row's own state, but no per-kind coverage.** The same connection overlay fills a picked-vendor row, so read it with the precedence in Tooling like any other row. What the result does not carry is the whole picture of a kind: it lists only the picked vendors' connectors, so a kind nobody picked has no row here and would read as missing while it is live. Describe that card as those vendors' tools, and take the per-kind states and `coverage` from a `kind`-scoped or unscoped call. An empty list means the session holds no pick for this workspace, no picked vendor matched a Well connector, or the matched connector is `output`-only or not `available` — say that, and report no kind as missing on it.

4. **State the coverage once. In `flow_step` mode, end the turn on the card.** Say one line per requested kind — what is connected, what is missing or in error, and why it matters for the job (`purpose`). Do not restate the rows or re-render them as a list or table: the card carries the tiles, the install links, its own scope title and the workspace strip.
   - **`internal_check`** → hand the coverage back in the same turn and keep going. No closing line, no Continue, no `well_wait_for_selection`. The caller asked for a figure, not for a connect step, and stopping here is what makes "what's my runway" cost three round-trips. When a `required` kind is missing the caller decides what to do with that — say so in the hand-off and let it choose; do not convert the read into a stop on your own.
   - **`flow_step`** → add the closing line — connect what is missing with the card's Connect buttons if you want, then click Continue — and end the turn. Even when every kind is green, the card stays on screen for the user to see and confirm the state, and the turn still ends here. Nothing else in the turn.
   - When the user asked about connections standalone (nothing follows), the coverage line ends the turn — the card is on screen, and there is nothing to chain.
   - In a text-only host, nothing renders. Name at most three connectors per missing kind — `is_preselected` rows first, then the user's provider hints via `q` — and treat the user's next message as the answer. Give one link, not one per tool, and only for connectors you named. For the exact rule on when `install_all_url` is the right offer versus per-row `install_url` links, read `references/install-links.md`.
   - If the user names a provider that is not in the default view, search it with `q` before saying Well does not support it. A row whose `status` is not `available` is not connectable today — say so and offer the nearest available alternative from the catalog rather than a dead link.

5. **Resolve the next message after the card.** In this order, and never by re-asking.

   **A second connect card in this conversation is never verified by a wait-read.** A session holds one ack per step, so `connect_ack` still carries the first card's click and answers `already_set` for a card nobody clicked. On such a run the acknowledgment comes from the user's own message — the card's "Continue" prefill or a typed continue — and the next step's own read is what verifies it.

   **The `required` gate applies to every path below that moves the flow on.** When a kind in `required` was **missing** or **error** on the read that rendered the card, re-read the coverage once in that turn (that turn's one card) before continuing — the user may have connected it during the stop. When the kind is still neither `connected` nor `connecting`, say plainly that the flow cannot continue without it and stop, keeping the hand-off so the caller reads `coverage` and decides. With no `required` kind outstanding, no such read is needed.

   - The user says in text they connected a tool ("I connected Qonto", "it's connected now") → re-read the coverage once in that turn (that turn's one card) and hand off the fresh state. This branch is checked before the generic acknowledgment below: a typed connection claim changes the coverage the hand-off must carry, so it can never ride the no-verification path.
   - The message is the card's "Continue" prefill, or says continue / done in its own words without claiming a new connection → that is the acknowledgment; move on in one short sentence, subject to the gate above. No verification call is needed on this path — the next step's own read is the verification, and anything the user connected during the stop lands in the later steps' own reads while the hand-off's coverage describes the read that rendered the card.
   - Any other message → call `well_wait_for_selection` once with the kind that matches the ack this run's card wrote: `{ kind: "connect_ack", timeout_s: 10 }`, or `{ kind: "bank_ack", timeout_s: 10 }` when step 3 scoped the call to `kind` `bank`. `selected` (fresh or `already_set`) → the ack is in; move on, subject to the same gate. `no_selection_yet` → one line asking to click Continue on the card, end the turn. Reading the wrong kind here answers `no_selection_yet` on a click the user already made, so it asks for that click a second time. **On a second connect card, make no call here at all**: ask in one line for the Continue click on the card now on screen, and end the turn.
   - The user declines a kind ("later", "skip invoicing") → record it under `skipped_by_user` and continue — unless the kind is in `required`, in which case say plainly that the flow cannot continue without it and stop, keeping the hand-off so the caller reads `coverage` and decides.

6. **On failure, redirect instead of guessing.** A transient error on `well_list_connectors` → retry once. A second failure → do not invent connection state and hand off no coverage at all: every value would be a claim you cannot make, and `coverage: none` would read as "nothing is connected" rather than "nothing could be read". Say the coverage is unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, tell them the connections page in Well shows and fixes the same thing, and hand the failure back to the caller. Do not append query parameters you have not confirmed the app reads.

7. **Hand off.** Keep the hand-off facts below for the caller — never printed as a block.

## Output requirements

Return:

- One line per requested kind: `bank`, `accounting`, `invoicing` — its state and the connector name(s) behind it (e.g. "Bank: connected to Qonto. Accounting: error, Pennylane needs a reconnect. Invoicing: missing.").
- The hand-off, kept for the calling flow and never printed: `workspace_id`; per requested kind its `state` (`connected`, `connecting`, `error`, or `missing`), the connectors behind it, and the `install_url` to act on; `coverage`; `ack` — `true` once the Continue click (or a typed continue) arrived, `false` while the step still waits; `skipped_by_user`; and `required` echoed from the caller. `coverage` is `complete` when every requested kind is `connected` or `connecting`, `none` when NO requested kind is `connected` or `connecting` — a workspace whose every kind is in `error` is delivering no data, so it is `none`, not `partial` — and `partial` otherwise. Only the requested kinds count. The connectors behind a kind include any errored connector named alongside a connected one. `install_url` belongs to the row that kind's line names: the errored row on `error` — or on `connected` when an errored connector sits beside the live one — the first `available` `is_preselected` row on `missing`, and null when the kind is cleanly `connected` or `connecting`. Carry the result's `install_all_url` and `install_all_omitted` once beside the per-kind lines, never per kind, because both describe the whole result — for exactly when to carry the batch link versus per-kind links, read `references/install-links.md`. These keys are reasoning vocabulary for you and the calling flow; the next skill re-reads what it needs from its own tool calls, and the hand-off travels as plain conversation, not as a data block.
- Connector coverage in plain words: this skill's coverage line IS the disclosure — say which of bank / accounting / invoicing are connected versus still missing so the calling flow and the user know whether what follows rests on a full picture.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step, and the scope this run reported decides which one. On a `picked_vendors` run the connect step already follows the vendor pick, so the pointer goes forward, never back to a step that already ran: when the `deploy-agents` skill is installed, "Next: what Well would fetch for those vendors." On any other scope, when the `connect-bank` skill is installed: "Next: the bank feed gets its own check. That is what the missing-invoice list is measured against." Otherwise, when `define-period` is installed: "Which month or period should we work on?". Otherwise hand control back to the skill that called this one, or, when the user asked about connections on their own, stop after the coverage line.
- The whole answer stays a few plain sentences a non-technical user understands: what is connected, what is missing, and the next step. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- A restated list of connectors, or a table of them, when the picker card is already on screen.
- Offering `install_all_url` for a set narrower than the connectors you named, or listing every row's own `install_url` beside a batch link that already covers them — for the exact rule, read `references/install-links.md`.
- Any figure computed from connector data.
- Connection state guessed from a connector's display name, or read from a `workspace_connectors` records query.
- In `flow_step` mode, a flow continuation that skipped the Continue click — the acknowledgment (clicked or typed) is the gate, green coverage included. (In `internal_check` there is no acknowledgment to skip: that mode never renders a stop.)

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the coverage in text regardless — you cannot know whether anything drew it. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify this run against the full checklist in `references/quality-checklist.md` — it covers tool-call discipline, the state precedence, the install-link offer, the acknowledgment gate, and the next-step pointer.

## Examples

Worked request/response pairs for every scope and edge case — the vendor-pick scope, `internal_check`, a `q` search earning a batch link, a text-only host, and more — are in `references/examples.md`.

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

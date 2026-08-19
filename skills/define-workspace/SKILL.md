---
name: define-workspace
description: Resolve which Well workspace (legal entity / company account) a conversation works in, and hand it off as a typed result — workspace_id, name, identity, and how it was resolved — to any Well skill or flow that follows. Use when the user asks to select, choose, switch, or confirm a workspace, says "use my FR entity" / "work in workspace X" / "which company account is this", or when a Well skill needs one workspace pinned before it reads or writes data. Do not use to connect a bank or accounting tool, to compute any financial figure, or to confirm the company identity inside the Well app.
---

# Define Workspace with Well

## Purpose

Pin exactly one Well workspace for the rest of the conversation. Read the workspaces this connection is authorized on, resolve a single one — automatically when there is one, from the user's hint when it matches, or from the user's pick otherwise — and return a typed hand-off that every later `well_*` call reuses as `workspace_id`. This is the first brick of Well's fetch-missing-invoices and close-books flows: their sub-skills take their `workspace_id` from this hand-off. Well's data skills (`expense-breakdown`, `runway-calculator`, …) still resolve the workspace inline today and can adopt the same hand-off.

## When to use this skill

Use this skill when:

- The user asks to select, choose, switch, or confirm a workspace ("use my US entity", "work in the Acme workspace", "which company account am I in?").
- A Well skill or an orchestrating flow (fetch missing invoices, close the books, connect tools) needs one workspace resolved before it continues.
- A Well tool answered `WORKSPACE_REQUIRED` or fanned out across several workspaces and the user needs to pick one.
- The user manages several legal entities in Well and it is unclear which one a request is about.

## When not to use this skill

Do not use this skill when:

- The user wants to connect a bank, accounting tool, or invoicing portal — that is the `connect-tools` skill (the next brick of the flow), or `connect-bank` for a bank-only ask, when they are installed.
- The user wants a number (runway, cash, expenses) — the data skills (`runway-calculator`, `cash-position`, `expense-breakdown`, …) already run this step internally; use them directly.
- The user wants to confirm or edit the company behind a workspace (registered name, tax id, child entities) — that happens in the Well app, not here.
- The user wants to create a workspace — Well's OAuth / sign-in flow creates the first workspace; this skill only reads what already exists.

## Inputs

The user or the calling skill may provide:

- A workspace hint: a `workspace_id`, a workspace name, or the company name behind it. Optional.
- A `purpose` line from the calling skill (e.g. "to fetch the invoices missing for March") so the question, if any, says why. Optional.

Nothing is required. With no hint and one workspace, the skill resolves silently.

## Tooling

This skill runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_workspaces` — the read this skill is built on. Takes no input; returns `workspaces[]` with `workspace_id`, `workspace_name` (nullable), `is_primary` (the token's default workspace), and `identity` (`registered_name`, `trade_name`, `registered_value`, `country`, `domain`, `base_currency`, `fiscal_year_start_month` — every field null until the workspace has accounting settings). In MCP-Apps hosts (Claude Desktop, ChatGPT) the result renders as an interactive workspace picker card.
- `well_switch_workspace({ workspace_id })` — pins one workspace as this connection's standing default, so a later call that omits `workspace_id` targets it. The pin is a default, not a permission: it only chooses among the workspaces the connection is already authorized for, it grants no new access, and `well_list_workspaces` keeps listing the whole set so the user can switch again. Call it when a hint resolved the workspace or the user picked one in text; the picker card's **Use** button already calls it itself, and one authorized workspace needs no pin at all. If it is not in your toolset, the Well server predates it — resolve the workspace as usual and rely on the explicit `workspace_id` argument alone.
- Well's OAuth / Dynamic Client Registration (DCR) flow, or the Well connector's `authenticate` tool if the host exposes one — when no Well connection exists yet.

The pin is a convenience, never the contract. Pass `workspace_id` explicitly on every call that follows, pinned or not — belt and braces, so one skill in a chain that forgets the argument cannot silently read a different entity.

## Workflow

1. **Confirm the MCP server is configured.** If `well_list_workspaces` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because the workspace list comes from Well and nothing can be resolved without it. Stop until it is there.

2. **Read the workspaces.** Call `well_list_workspaces()`.
   - Auth error → no Well connection yet: start the Well connector's OAuth/DCR flow. The moment it returns, retry `well_list_workspaces()` yourself in the same turn and continue — do not ask the user to confirm they signed in.
   - `success: false` with a non-auth error → retry once; if it fails again, go to step 6.
   - Zero workspaces → the account has no workspace yet. Say so, point the user to Well to finish signing up, and return `resolution: unresolved`.

3. **Resolve without asking when you can.**
   - Exactly one workspace → use it. `resolution: single`. Say which one in one line; do not ask for confirmation. Do not call `well_switch_workspace` here: with one authorized workspace there is nothing to choose between, and every call already resolves to it.
   - Several workspaces and a hint → match the hint exactly on `workspace_id`; otherwise case-insensitively on `workspace_name`, `identity.registered_name`, `identity.trade_name`, or — for a country hint such as "my US entity" — on `identity.country` (ISO code). Exactly one match → use it, `resolution: hint_matched`, and say which one you matched. Then call `well_switch_workspace({ workspace_id })`, because the match may not be the connection's default and the pin is what keeps a later call from falling back to a sibling entity. A failed or absent switch is not a stop — continue on the explicit argument. Zero or several matches → fall to step 4; never pick the closest name.

4. **Ask, on the card, once.** With several workspaces and no usable hint:
   - In an MCP-Apps host the `well_list_workspaces` result already shows the picker card (one tile per workspace, the token's default marked, identity on hover). Do not restate the workspaces as a list or table under it. Ask one line — the calling skill's `purpose` if given, e.g. "Which workspace should I fetch the missing March invoices for?" — and stop.
   - In a text-only host, list each workspace on one line: name, country, base currency, and "(default)" on the primary. Ask the same one-line question and stop.
   - Do not default to the primary workspace on the user's behalf. `is_primary` is a fact to display, not a choice to make.

5. **Read the answer.**
   - The card's **Use** button performs the switch itself: it calls `well_switch_workspace` with the workspace the user picked, then says one line naming the workspace it is now working in (for example `Working in <name> now.`). By the time you read that line the pin is already in place — do not call `well_switch_workspace` again for it. Map the name back to its `workspace_id` from the same `well_list_workspaces` result — never a guessed id. If that name is null or matches more than one row, ask which one they picked rather than choosing the closest. `resolution: user_picked`.
   - A typed answer names or describes one workspace instead. Map it back to its `workspace_id` the same way, then call `well_switch_workspace({ workspace_id })` yourself so the rest of the conversation defaults to it. `resolution: user_picked`. If that call fails, or the tool is absent, continue anyway — the pin is a convenience and the explicit `workspace_id` argument carries the choice regardless. Do not re-ask the user.
   - The card's secondary button sends `Let's come back to choosing a workspace later.` → `resolution: unresolved`. Say that nothing was pinned and stop; do not call `well_switch_workspace` and do not run any workspace-scoped call.
   - An answer that matches no workspace → say so and re-ask once against the same set. Do not call `well_list_workspaces` again unless the user says the set changed.

6. **On failure, redirect instead of guessing.** If `well_list_workspaces` fails twice, do not invent a workspace. Tell the user, and give them `<well-app-base-url>` to open Well directly — signing in lands them in their workspace. Do not append a path or query parameter you have not confirmed the app resolves.

7. **Hand off.** Restate the resolved workspace in one line and emit the hand-off block below. From here on, pass `workspace_id` explicitly on every `well_*` call, whether or not `well_switch_workspace` succeeded. A pin changes what an omitted argument falls back to; it does not make the argument optional. Without both, a call that omits it on an unpinned connection lets read tools fan out across every authorized workspace and write tools fail with `WORKSPACE_REQUIRED`.

## Output requirements

Return:

- One line naming the pinned workspace with its `identity.country` and `identity.base_currency` when set (e.g. "Working in **Acme SAS** (FR, EUR)."). When identity fields are null, say the workspace has no accounting settings yet rather than printing nulls.
- The hand-off block, exactly these keys, so a calling skill can read it:

  ```yaml
  workspace_id: <uuid>
  workspace_name: <name or null>
  is_primary: <true|false>
  identity:
    registered_name: <value or null>
    trade_name: <value or null>
    country: <ISO code or null>
    base_currency: <ISO code or null>
    fiscal_year_start_month: <1-12 or null>
  resolution: single | hint_matched | user_picked | unresolved
  ```

  On `unresolved`, every other key is null.
- The instruction that applies to the rest of the conversation: pass `workspace_id: <uuid>` on every following `well_*` call — including when the workspace was pinned as this connection's default, which happens on every resolution except `single` (nothing to pin) and `unresolved` (nothing resolved).
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `connect-tools` skill is installed: "Is a bank and an accounting tool connected to this workspace?". Otherwise hand control back to the skill that called this one, or, when the user asked for the workspace on its own, ask what they want to do in it.

Do not return:

- A restated list of the workspaces when the picker card is already on screen.
- A workspace chosen by similarity or by `is_primary` when the user did not pick it.
- Data from any workspace other than the pinned one.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- After an OAuth/DCR flow, `well_list_workspaces()` was retried in the same turn.
- Exactly one workspace is pinned, or `resolution: unresolved` is returned — never two, never a merged view.
- A hint resolved only on an exact id or a case-insensitive name match with exactly one hit.
- With several workspaces and no hint, the user was asked once, in one line, and the workspaces were not narrated when the card was on screen.
- `well_switch_workspace` was called exactly once on `hint_matched` and on a typed pick, not at all on the card's **Use** button (which called it itself), not at all on `single` (nothing to choose between), and not at all on **Keep for later**. A failed or absent switch did not stop the skill or re-ask the user.
- The `workspace_id` in the hand-off comes from the `well_list_workspaces` result the user answered against.
- The hand-off block carries all keys with `resolution` set.
- On a transient failure the call was retried once before the fallback link.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`connect-tools` when installed, otherwise the caller or a question).

## Examples

### Example request

"Fetch the invoices I'm missing for March." (calling skill invokes define-workspace with `purpose: "to fetch the invoices missing for March"`; the connection covers one workspace)

### Expected behavior

Call `well_list_workspaces()`, get one workspace, and continue without asking: "Working in **Acme SAS** (FR, EUR)." followed by the hand-off block with `resolution: single`.

### Example request

"Show me my runway." (the connection covers Acme SAS and Acme Inc.; no hint)

### Expected behavior

The picker card renders on the tool result. Ask exactly one line — "Which workspace should I compute the runway for?" — and stop. When the user presses **Use** on Acme Inc., the card switches the connection to it and says "Working in Acme Inc. now." — the pin is already done, so do not switch again. Map the name to its `workspace_id`, answer "Working in **Acme Inc.** (US, USD).", emit the block with `resolution: user_picked`, and still pass that `workspace_id` on every later call.

### Example request

"Use the Acme Inc. one." typed as a reply to the picker (no button pressed).

### Expected behavior

Map "Acme Inc." to its `workspace_id` from the same `well_list_workspaces` result, then call `well_switch_workspace({ workspace_id })` so later calls default to it. Report the workspace, emit the block with `resolution: user_picked`, and keep passing `workspace_id` explicitly. If the switch call fails, say nothing about it and continue — the explicit argument already carries the choice.

### Example request

"Use my US entity for this."

### Expected behavior

Match "US" against `identity.country`. Exactly one workspace with `country: "US"` → call `well_switch_workspace({ workspace_id })` to pin it, say "Working in **Acme Inc.** (US, USD).", and emit the block with `resolution: hint_matched`. Two US workspaces, or none with a country set → do not guess: the picker is on screen, ask which one is the US entity, and stop.

### Example request

The user presses **Keep for later** on the card.

### Expected behavior

Return `resolution: unresolved`, say no workspace was pinned, and stop — do not call `well_switch_workspace`, do not fall back to the default workspace, and do not run any workspace-scoped read.

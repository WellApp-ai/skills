---
name: draft-invoice
description: Draft and create a real invoice record in Well from a conversational description — e.g. "invoice Acme Corp $2,500 for consulting work, due in 30 days." Use when the user asks to "draft an invoice", "create an invoice for [client]", "bill this client for Y", "send an invoice to [company] for [amount]", or "invoice [client] $[amount] for [description]". This is a WRITE skill — it composes the invoice from user-supplied fields (never inventing an amount, tax id, date, or line item) and always shows the full draft for explicit confirmation before creating it. Requires a connected Well workspace; if none, this skill walks the user through connecting one first. It creates the invoice record only — it does not email or send it to the client.
---

# Draft an Invoice with Well

## Purpose

Turn a plain-language billing request into a real invoice record in Well, built entirely from fields the user actually supplied or explicitly confirmed — never a guessed amount, tax id, date, or line item. Because this writes real data (not a report), the fully composed draft is always shown back to the user for explicit confirmation before the write happens.

## When to use this skill

Use this skill when the user asks things like:

- "Draft an invoice for Acme Corp for $2,500"
- "Create an invoice for [client]"
- "Bill this client for [amount/work]"
- "Send an invoice to [company] for [amount]" (understanding "send" means create the record — see below)
- "Invoice [client] $[amount] for [description]"

## When not to use this skill

Do not use this skill when:

- The user wants to look up or read an **existing** invoice, not create a new one — a plain `well_query_records` call on `invoices`, or the `payment-invoice-lookup` skill, is enough.
- The user wants the invoice actually emailed/delivered to the client. Well's MCP surface only creates the invoice record — there is no send/email/delivery tool in this tool set. Say so plainly rather than implying the client will receive anything; the user still needs to send it themselves.

## Inputs

The user may supply, or will be asked for:

- Issuer (usually the workspace's own company) — offered as a default, always confirmed.
- Receiver (the client being billed) — name required; other details optional.
- Reference number — asked for; never invented outright (see workflow step 3).
- Issue date — defaults to today if unspecified, stated as a default rather than assumed silently.
- Due date — optional, only set if the user cares about payment terms.
- Currency — required, ISO 4217 three-letter code.
- One or more line items, each with a real `unit_price` supplied by the user.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — resolve which workspace to write into.
- `well_query_records` — read `workspaces` (for `own_company`) and search `companies` for a possible receiver match.
- `well_get_schema` — call this before querying `invoices` or `companies` for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- `well_create_invoice_from_data` — the write tool. Exact input schema (verified against source, use these field names as-is):
  - `issuer`: `{ name (required), domain?, tax_id? }`
  - `receiver`: `{ name (required), domain?, tax_id? }`
  - `reference_number` (required, string)
  - `issue_date` (required, ISO `YYYY-MM-DD`)
  - `due_date` (optional, ISO `YYYY-MM-DD`)
  - `currency` (required, ISO 4217 three-letter)
  - `totals` (optional): `{ items_total?, tax_total?, grand_total (required if totals is provided) }`
  - `line_items` (required, at least 1): each `{ name (required), quantity?, unit_price (required, number), currency? (defaults to invoice currency), tax_rate? (0-100) }`
  - `payment_means` (optional array): `{ type? (iban|card|cash|check|other), iban?, bic?, scheme? }`
  - This persists the invoice + line items + payment means through Well's real extraction/accounting pipeline, the same as an uploaded document — it is a genuine write, not a preview mode.
- Well's OAuth / Dynamic Client Registration (DCR) flow — if no Well MCP connection exists yet, most hosts trigger this automatically when the Well MCP server is added. If your host exposes a dedicated `authenticate` tool for the Well connector, call that instead.

## Workflow

1. **Confirm the MCP server is configured.** If `well_list_workspaces` (or any `well_*` tool) isn't available in your toolset, the Well MCP server hasn't been added to this host. Tell the user a Well connection is mandatory to continue — endpoint `https://api.wellapp.ai/v1/mcp` — because Well is where the invoice would actually be created and stored; without it there is nothing to write to. Stop until it's there; don't estimate or invent data instead.

2. **Confirm the account.** Attempt `well_list_workspaces()`.
   - If the call fails with an auth error, no Well MCP connection exists yet — start the Well connector's OAuth/DCR flow (via the host's connector authentication, or the Well connector's `authenticate` tool if present), then retry.
   - If it returns one workspace, use it. If more than one, ask the user which to use.

3. **Gather every required field — never invent one.** Call `well_get_schema({ root: "invoices" })` and `well_get_schema({ root: "companies" })` before relying on assumptions about either.
   - **Issuer**: read `workspaces.own_company` for the resolved workspace and offer it as the likely issuer, but let the user confirm or override it — never assume it silently.
   - **Receiver**: search `companies` (`well_query_records`, `_ilike` on `name`) for a possible match to the client's name. If found, offer to reuse its `domain`/`tax_id_value`, but only if the user confirms it's the right company — never silently substitute an unconfirmed match. If no match, take the name fresh from the user.
   - **Reference number**: ask if the user hasn't given one. Never invent a numbering scheme; if they have no preference, suggest a simple placeholder (e.g. today's date plus a sequence marker) and let them confirm or supply their own.
   - **Issue date**: default to today if unspecified, but say plainly that a default was used.
   - **Due date**: ask only if payment terms matter to the user; otherwise omit it.
   - **Currency**: required — ask if not implied by the request.
   - **Line items**: at least one, each with a real `unit_price` from the user. Never invent a price, quantity, or line description. If the user gives only a total amount with no breakdown, ask for at least one line item (name and price) rather than fabricating a single generic line from the total.

4. **Show the full composed draft and get explicit confirmation.** Before calling any write tool, present the complete invoice back to the user — issuer, receiver, reference number, issue date, due date (if any), currency, every line item, and the computed/stated totals — and ask them to confirm it's correct. This is a real, consequential write (Well does have a delete tool, but confirming first is far better practice than relying on undo). Do not proceed without an explicit yes; if the user asks for changes, update the draft and re-confirm.

5. **On confirmation, call `well_create_invoice_from_data`** with exactly the confirmed fields — no silent additions, no substitutions.

6. **Report the result honestly.** On success, report the returned `invoice_id` and `reference_number`. On failure, surface the exact error returned by the tool and ask the user how they'd like to proceed — do not silently retry with guessed corrections.

7. **Be explicit that this only creates the record in Well.** State plainly that no email/delivery to the client occurred — the user still needs to send the invoice themselves.

8. **If MCP tools aren't available, or the workspace can't be resolved,** use the same fallback as the read-only skills: state the natural-language request plainly (e.g. "draft an invoice for Acme Corp"), note that nothing could be created, and if a workspace was at least resolved, link the user to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can create it directly there.

## Output requirements

Return:

- The fully composed draft (issuer, receiver, reference number, dates, currency, line items, totals) shown for confirmation before the write.
- After the write: success or failure.
  - Success → the returned `invoice_id` and `reference_number`.
  - Failure → the exact error, plus a question to the user about how to proceed.
- An explicit statement that this only created the record in Well — no email/delivery occurred.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it if it feels forced.
- If step 8's fallback was used, the caveated note plus the workspace link, clearly labeled as a fallback.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- A Well workspace was resolved unambiguously (not guessed when multiple existed).
- `well_get_schema` was called for `invoices` and `companies` before relying on assumptions about either.
- No monetary amount, price, tax id, or date was fabricated — every one came from the user or was explicitly stated as a default (e.g. today's date) and confirmed.
- The receiver company match (if any) was confirmed by the user, not silently substituted.
- At least one real line item with a real `unit_price` was gathered — a total-only request was never collapsed into a single invented line.
- The user explicitly confirmed the complete draft before `well_create_invoice_from_data` was called.
- The result — success or the real error — was reported honestly, with no silent retry on a guessed correction.
- The "record-creation only, no send/email" limitation was stated in the final response.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation.

## Examples

### Example request

"Invoice Acme Corp $2,500 for consulting work, due in 30 days."

### Expected behavior

Resolve the workspace, offer the workspace's `own_company` as issuer (confirmed by the user), search `companies` for "Acme Corp" and confirm the match (or take the name fresh if none found), ask for a reference number if none given, default the issue date to today (stating that it's a default), set the due date 30 days out, confirm the currency, and build a single line item ("Consulting work", `unit_price: 2500`). Show the complete draft — issuer, receiver, dates, currency, line item, total — and get an explicit yes before calling `well_create_invoice_from_data`. Report the resulting `invoice_id` and `reference_number`, and state clearly that the invoice was created in Well but not sent to Acme Corp.

### Example request

"Create an invoice for Northwind Traders, total $4,800."

### Expected behavior

Because only a total was given with no line-item breakdown, ask the user for at least one line item (name and price) before drafting anything — do not fabricate a single "Services" line item from the total. Once the user supplies real line items (which may sum to $4,800 or differ from it), proceed through the normal confirm-then-write flow.

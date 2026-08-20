---
name: draft-invoice
requires: [define-workspace, resolve-own-company]
description: Draft and create a real invoice record in Well from a conversational description — e.g. "invoice Acme Corp $2,500 for consulting work, due in 30 days." Use when the user asks to "draft an invoice", "create an invoice for [client]", "bill this client for Y", "send an invoice to [company] for [amount]", or "invoice [client] $[amount] for [description]". This is a WRITE skill — it composes the invoice from user-supplied fields (never inventing an amount, tax id, date, or line item) and always shows the full draft for explicit confirmation before creating it. Once created, it also renders the invoice into a print-ready A4 PDF on the issuer's own letterhead and attaches it to the invoice record. Requires a connected Well workspace; if none, this skill walks the user through connecting one first. It creates the invoice record and its attached PDF only — it does not email or send anything to the client.
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
- The user wants the invoice actually emailed/delivered to the client. Well's MCP surface creates the invoice record and a PDF of it — there is no send/email/delivery tool in this tool set. Say so plainly rather than implying the client will receive anything; the user still needs to send it themselves.

## Inputs

The user may supply, or will be asked for:

- Issuer (usually the workspace's own company) — offered as a default, always confirmed.
- Receiver (the client being billed) — name required; other details optional.
- Reference number — asked for; never invented outright (see workflow step 2).
- Issue date — defaults to today if unspecified, stated as a default rather than assumed silently.
- Due date — optional, only set if the user cares about payment terms.
- Currency — required, ISO 4217 three-letter code.
- One or more line items, each with a real `unit_price` supplied by the user.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. Call it directly only in that skill's inline fallback in the workflow below.
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
- `well_create_invoice_document` — renders the invoice created above into a print-ready A4 PDF and attaches it as a `Document` linked to the invoice row. Input schema (use these field names as-is):
  - `invoice_id` (required, string, UUID) — the invoice returned by `well_create_invoice_from_data`.
  - `workspace_id` (optional, string) — the workspace to write into, same as every Well MCP write tool.
  - `idempotency_key` (optional, string) — same as every Well MCP write tool.
  - Returns `{ success, invoice_id, document_id, reference_number }`.
  - Fails with a 409-class error when the invoice already has a real source document attached — an ingested vendor PDF or scan. It never overwrites one; it only repoints the metadata-only stub that `well_create_invoice_from_data` leaves behind.
  - The letterhead uses the issuer's own logo only if Well already has one on file for that company; otherwise it prints the issuer's name as text. A logo is usually absent for a company Well has just met, so never promise one.
  - This does not make the PDF a legally-compliant sequential invoice — Well keeps no invoice-numbering sequence. The reference number printed on it is exactly the one the user supplied in step 2, never an invented one.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Two atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `resolve-own-company` — called in `suggest` mode only, to offer the workspace's own company as the likely issuer for the user to confirm.

Both ship with the `well-skills` plugin. This skill is also installable on its own, so step 1 of the workflow carries the inline fallback to use when it's absent.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to draft and create this invoice"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: nothing can be created without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Gather every required field — never invent one.** Call `well_get_schema({ root: "invoices" })` and `well_get_schema({ root: "companies" })` before relying on assumptions about either.
   - **Issuer**: invoke the `resolve-own-company` skill with the pinned `workspace_id` and `mode: suggest` — it reads `workspaces.own_company` and hands back a default without running the full resolution ceremony, because the user confirms the issuer on the draft anyway. Offer that company as the likely issuer and let the user confirm or override it; never assume it silently. If the skill isn't installed, read `workspaces.own_company` directly for the same suggestion, and if it's null or absent from the schema, just ask who the issuer is rather than inferring it from the workspace's name.
   - **Receiver**: search `companies` (`well_query_records`, `_ilike` on `name`) for a possible match to the client's name. If found, offer to reuse its `domain`/`tax_id_value`, but only if the user confirms it's the right company — never silently substitute an unconfirmed match. If no match, take the name fresh from the user.
   - **Reference number**: ask if the user hasn't given one. Never invent a numbering scheme; if they have no preference, suggest a simple placeholder (e.g. today's date plus a sequence marker) and let them confirm or supply their own.
   - **Issue date**: default to today if unspecified, but say plainly that a default was used.
   - **Due date**: ask only if payment terms matter to the user; otherwise omit it.
   - **Currency**: required — ask if not implied by the request.
   - **Line items**: at least one, each with a real `unit_price` from the user. Never invent a price, quantity, or line description. If the user gives only a total amount with no breakdown, ask for at least one line item (name and price) rather than fabricating a single generic line from the total.

3. **Show the full composed draft and get explicit confirmation.** Before calling any write tool, present the complete invoice back to the user — issuer, receiver, reference number, issue date, due date (if any), currency, every line item, and the computed/stated totals — and ask them to confirm it's correct. This is a real, consequential write (Well does have a delete tool, but confirming first is far better practice than relying on undo). Do not proceed without an explicit yes; if the user asks for changes, update the draft and re-confirm.

4. **On confirmation, call `well_create_invoice_from_data`** with exactly the confirmed fields — no silent additions, no substitutions. If this fails, stop here: surface the exact error and ask the user how they'd like to proceed (see step 6). Do not attempt step 5 without a created invoice.

5. **On success, call `well_create_invoice_document`** with the `invoice_id` just returned, to render the invoice into a PDF and attach it to the record. This is not a separate ask — the confirmation the user gave in step 3 already covers producing the invoice and its PDF together. If the call fails, do not retry it silently: surface the exact error and ask the user how they'd like to proceed (retry, skip the PDF, or handle the document another way). A failed render never undoes the invoice created in step 4 — say so plainly so the user knows the record itself is safe.

6. **Report the result honestly.** On success, report the returned `invoice_id`, `reference_number`, and — once step 5 completes — the `document_id`. If step 4 failed, surface its exact error and ask the user how to proceed; no PDF is attempted. If step 4 succeeded but step 5 failed, report both outcomes: the invoice exists, and the PDF render failed with the specific error. Never invent or silently retry a correction for either failure.

7. **Be explicit that this creates the record plus an attached PDF in Well.** State plainly that no email/delivery to the client occurred — the user still needs to send the invoice themselves.

8. **If MCP tools aren't available, or the workspace can't be resolved,** use the same fallback as the read-only skills: state the natural-language request plainly (e.g. "draft an invoice for Acme Corp"), note that nothing could be created, and if a workspace was at least resolved, link the user to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can create it directly there. If a transient (network/timeout) error hits one of the *read* calls in steps 1-2 (resolving the workspace or looking up a company match), retry that call once before falling back. Never apply this retry to the `well_create_invoice_from_data` write in step 4 or the `well_create_invoice_document` write in step 5 — a retried write risks creating a duplicate invoice or a duplicate document; step 6 already covers write failures (surface the real error, no silent retry).

## Output requirements

Return:

- The fully composed draft (issuer, receiver, reference number, dates, currency, line items, totals) shown for confirmation before the write.
- After the invoice write: success or failure.
  - Success → the returned `invoice_id` and `reference_number`.
  - Failure → the exact error, plus a question to the user about how to proceed.
- After the document render (only attempted once the invoice write succeeds):
  - Success → the returned `document_id`, alongside the `invoice_id` and `reference_number`.
  - Failure → the exact error, plus a question to the user about how to proceed. State clearly that the invoice record itself still exists.
- An explicit statement that this created the record plus an attached PDF in Well — no email/delivery occurred.
- Never claim the PDF carries the issuer's logo unless Well confirmed one was used — it prints as text when no logo is on file, which is the common case for a company Well has just met.
- Never call the PDF a legally-compliant sequential invoice — Well keeps no invoice-numbering sequence, and the reference number on it is whatever the user supplied.
- Whether the picture is complete: which issuer/receiver details came from existing Well records versus fresh from the user, and — if the `companies` search found no match for the client — that Well has nothing on file for them yet, so the user knows nothing was silently substituted.
- A one-line pointer to `payment-invoice-lookup` for finding the payment that settles this invoice once the client pays.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it if it feels forced.
- If step 8's fallback was used, the caveated note plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one. Do
not compose a second rendering of figures the tool already returned; where a visual the
tool does not draw genuinely reads better and the `well-design-system` skill is available,
use it.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- `well_get_schema` was called for `invoices` and `companies` before relying on assumptions about either.
- No monetary amount, price, tax id, or date was fabricated — every one came from the user or was explicitly stated as a default (e.g. today's date) and confirmed.
- The receiver company match (if any) was confirmed by the user, not silently substituted.
- At least one real line item with a real `unit_price` was gathered — a total-only request was never collapsed into a single invented line.
- The user explicitly confirmed the complete draft before `well_create_invoice_from_data` was called.
- `well_create_invoice_document` was called with the new `invoice_id` right after a successful create, never before, and never retried silently on failure.
- The result of both calls — success or the real error, for each — was reported honestly, with no silent retry on a guessed correction. A failed render was reported without implying the invoice record was lost.
- The "record plus attached PDF, no send/email" limitation was stated in the final response.
- No claim was made that the PDF carries the issuer's logo unless Well actually used one.
- No claim was made that the PDF is a legally-compliant sequential invoice.
- Which details came from existing Well records versus fresh from the user was stated, so nothing appears silently substituted.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation.

## Examples

### Example request

"Invoice Acme Corp $2,500 for consulting work, due in 30 days."

### Expected behavior

Run `define-workspace`, offer the workspace's `own_company` as issuer (confirmed by the user), search `companies` for "Acme Corp" and confirm the match (or take the name fresh if none found), ask for a reference number if none given, default the issue date to today (stating that it's a default), set the due date 30 days out, confirm the currency, and build a single line item ("Consulting work", `unit_price: 2500`). Show the complete draft — issuer, receiver, dates, currency, line item, total — and get an explicit yes before calling `well_create_invoice_from_data`. Once it succeeds, call `well_create_invoice_document` with the new `invoice_id` to render and attach the PDF. Report the resulting `invoice_id`, `document_id`, and `reference_number`, and state clearly that the invoice and its PDF were created in Well but not sent to Acme Corp.

### Example request

"Create an invoice for Northwind Traders, total $4,800."

### Expected behavior

Because only a total was given with no line-item breakdown, ask the user for at least one line item (name and price) before drafting anything — do not fabricate a single "Services" line item from the total. Once the user supplies real line items (which may sum to $4,800 or differ from it), proceed through the normal confirm-then-write flow.

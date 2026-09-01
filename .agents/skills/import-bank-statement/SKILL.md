---
name: import-bank-statement
description: Import a bank statement file into Well as real transaction records, matched against existing data and promoted into the workspace. Use when the user asks to import a bank statement, upload their statement, add bank transactions from a file, import a bank CSV or PDF, or reconcile a bank export — and equally when they drop a statement-looking file with no explanation at all — a CSV/XML/TXT whose rows carry transaction dates, amounts, payees, balances, or an IBAN, a PDF or photo of an account statement, or a file named like one (statement, transactions, export, releve, releve_bancaire, compte). Accepts .csv, .xml, .txt (text) and .pdf, .jpg, .jpeg, .png, .gif, .heic, .heif, .avif, .webp (image) statement exports; OFX, QIF, and MT940 files are not supported, and this skill says so instead of failing silently. Needs no connector — the uploaded file is the data source itself, so this runs on a fresh Well workspace with nothing connected yet.
---

# Import a Bank Statement into Well

## Purpose

Turn a bank statement file the user has in this conversation — a CSV/XML/TXT export, or a PDF/image scan — into real, promoted transaction records in Well, using the exact same import pipeline an in-app upload runs through (detection, dedup, promotion). This is the manual, one-off counterpart to a live bank connector sync: it works the moment a workspace exists, with no bank, accounting, or invoicing connection required, because the file itself carries the data a connector would otherwise fetch.

## When to use this skill

Use this skill when the user asks things like:

- "Import this bank statement"
- "Upload my statement"
- "Add my bank transactions from this file"
- "Import this CSV / PDF from my bank"
- "Reconcile this bank export"
- Or simply drops a statement file (CSV, XML, TXT, PDF, or image) into the conversation without further explanation — a dropped-in bank export is itself the request. Recognize one by its shape, not only its name: tabular rows of dates, amounts, and payees, a running balance column, an IBAN or account number, or a bank's letterhead on a PDF/photo; filenames like statement, transactions, export, or releve (relevé bancaire) are the same signal.

## When not to use this skill

Do not use this skill when:

- The file is OFX, QIF, or MT940. Well's import pipeline does not accept these formats yet — say so plainly and ask for a CSV, XML, TXT, PDF, or image export instead, rather than attempting the upload and letting it fail opaquely.
- The user wants an ongoing, automatic bank feed rather than a one-off file import — use `connect-bank` instead; that skill sets up the live sync this one does not replace.
- The user wants their current cash position or to reconcile these transactions against invoices — use `cash-position` or `payment-invoice-lookup` on what this skill already imported, not this skill again.

## Inputs

The user supplies:

- The statement file itself, present in this conversation — pasted or dropped in. For a text format (CSV/XML/TXT) its content must be verbatim-visible in the conversation; for a binary format (PDF/image) its raw bytes need to be available to encode.
- A workspace hint, if the user manages more than one Well entity — passed straight through to `define-workspace`, which resolves it.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace.
- `well_upload_statement_bytes` — uploads a binary statement's bytes directly. Input: `filename` (its extension selects the format) and `content_base64` (RFC 4648, whitespace tolerated), plus an optional `sha256` (64 hex characters) the server checks the decoded bytes against and rejects on mismatch. Accepts `.pdf`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.heic`, `.heif`, `.avif`, `.webp`; decoded cap 5 MiB (5,242,880 bytes) — over the cap is a hard reject, never a truncation. Returns `{ success, document_id, content_sha256, byte_length, deduplicated }` synchronously; parsed rows arrive on the poll.
- `well_upload_statement_content` — uploads a text statement's content directly. Input: `filename` and `content_text` (the file's full text, verbatim). Accepts `.csv`, `.txt`, `.xml`; decoded cap 1 MiB (1,048,576 bytes), hard reject over cap. An `.xml` file with a `DOCTYPE` or `ENTITY` declaration is rejected outright. Same output shape as the bytes tool.
- `well_create_statement_upload` — mints a single-use, 15-minute upload slot with no file bytes in the call itself (`{}` strict input). Returns `{ success, upload_url, token, document_id, expires_in_seconds: 900 }`; the caller then POSTs the raw file to `upload_url` with `Authorization: Bearer <token>`. The token is burned on first use.
- `well_get_statement_import_result` — polls the outcome by `document_id`. Status is one of `not_found_yet`, `processing`, `needs_account`, `imported`, `duplicate`, `skipped`, `failed`. On `imported`, `matched_count` / `review_count` / `minted_count` / `already_present_count` cover every promotable line of the file disjointly — an absent count means the row predates count tracking, treat it as unknown, never as 0. `records_url` is a login-gated deep link to the workspace's transactions table.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here.

This skill needs no connector. The uploaded file is the data source itself — there is nothing for a bank, accounting, or invoicing connection to add to this specific import, so this skill does not check or wait on one.

## Workflow

1. **Pin the workspace.** 
Call each list or read tool once per step, and render at most one widget card per turn. The cards refresh themselves. A card click executes server-side and prefills a message in the user's composer — rendering a card therefore ends the turn, and the sent message is how the routine resumes.

Confirm the Well MCP server is configured — if `well_list_workspaces` (or any `well_*` tool) is not available, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop until it's there.

Call `well_list_workspaces()`.
- Auth error → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry `well_list_workspaces()` yourself in the same turn and continue — do not ask the user to confirm they signed in.
- `success: false` with a non-auth error → retry once; on a second failure, do not invent a workspace — tell the user and give them `<well-app-base-url>` to open Well directly.
- Zero workspaces → the account has no workspace yet. Say so, point the user to Well to finish signing up, and return `resolution: unresolved`.
- `session.pinned_workspace_id` set, and THIS conversation established it (its own picker click or typed choice earlier in the conversation), and the user is not asking to pick or switch → use it silently, map it to its row, `resolution: user_picked`, skip straight to the hand-off. A non-empty `session.workspace_queue` alongside it means a multi-pick is mid-walk — hand off `multi_picked` with the pin first and the queue behind it.
- `session.pinned_workspace_id` set, but this conversation never rendered the picker nor took a typed choice → it's another conversation's leftover. Ignore it and resolve as if unset. Never mention it — "already pinned" is forbidden phrasing — and never skip the picker because of it.

Resolve without asking when you can:
- Exactly one workspace → use it, `resolution: single`. Say which one in one line; do not ask for confirmation and do not call `well_switch_workspace`.
- Several workspaces and a hint (a `workspace_id`, name, or company behind it) → match it exactly on `workspace_id`; otherwise case-insensitively on `workspace_name`, `identity.registered_name`, `identity.trade_name`, or — for a country hint such as "my US entity" — on `identity.country` (ISO code). Exactly one match → use it, `resolution: hint_matched`, say which one you matched, and call `well_switch_workspace({ workspace_id })` so a later call can't fall back to a sibling entity. Zero or several matches → fall to the picker below; never pick the closest name.
- A hint naming several entities ("FR and US", "both my companies") is a sequence, not an ambiguity — split it into fragments, match each exactly as above, keep the user's order. Every fragment matching exactly one distinct workspace, and at least two distinct workspaces matched → call `well_switch_workspace({ workspace_ids: [...] })` once, in that order — the first is pinned, the rest become the session's `workspace_queue` — `resolution: multi_picked`. Any fragment matching zero or several workspaces → fall to the picker; never resolve part of a compound hint and drop the rest silently.

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to import your bank statement" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

Resolve the next message after the card, in this order, never by re-asking:
- The message is the card's prefill ("Continue in <name>", or the multi form "— then …") → the click already pinned it server-side. Acknowledge in half a sentence and continue — never re-verify with an extra call, never call `well_switch_workspace` for it. A single name → `resolution: user_picked`; the multi form → `resolution: multi_picked`.
- The message names one or more workspaces in its own words → map each to its `workspace_id` from the earlier result — never a guessed id — then call `well_switch_workspace` yourself (`workspace_id` for one, `workspace_ids` for several, in the user's order). A name matching zero or several rows is asked about, never guessed.
- The message declines ("later", "not now") → `resolution: unresolved`. Say nothing was pinned and stop; do not call `well_wait_for_selection`, do not run any workspace-scoped call.
- Any other message that needs the workspace → call `well_wait_for_selection({ kind: "workspace", timeout_s: 10 })` once. `selected` → continue on `selection.workspace_id` (an empty `selection.workspace_queue` is `user_picked`, non-empty is `multi_picked`). `no_selection_yet` → one line asking to click the card, end the turn.

Emit the hand-off:

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
resolution: single | hint_matched | user_picked | multi_picked | unresolved
workspaces: [{ workspace_id, workspace_name, identity, ... }, …]  # multi_picked only — pinned entry first, then the queue in order
```

On `unresolved`, every other key is null. Pass `workspace_id` explicitly on every `well_*` call from here on, pinned or not — a pin changes what an omitted argument falls back to, it does not make the argument optional.

On `multi_picked`: the caller runs its whole walk on the pinned workspace first, then calls `well_switch_workspace({ workspace_id: <next> })` on the next queue entry (read from `well_list_workspaces`' `session.workspace_queue`, never from chat) and repeats. Each pass carries its own `workspace_id` explicitly and gets its own recap — nothing is merged across two entities: no shared row, no combined total.

Verify before moving on: exactly one workspace is pinned, or `resolution: unresolved` — never two, never a merged view; `session.pinned_workspace_id` was trusted only when this conversation established it; a hint resolved only on an exact id match or an unambiguous case-insensitive name match; `well_switch_workspace` was called exactly once on a hint match or typed pick and not at all for a pick the card itself already made; on `multi_picked`, the loop rule (one entity at a time, own recap, no merging) was stated in the hand-off.


2. **Confirm you actually have the statement in hand, verbatim.** Before picking a transport, make sure the file's content (its text, or its raw bytes) is still directly present in this conversation's context, not a memory of having seen it earlier. In a long-running conversation an earlier attachment can drop out of context entirely — if that has happened, do not reconstruct the statement from memory or from your own earlier narration of it: refuse the upload and fall to rung (d) below instead, telling the user plainly that you no longer have the file and asking them to attach it again or use the Well app directly.

3. **Pick the transport rung, tool-first** — the rung that moves the file with the fewest round trips and the least risk of a mangled relay, tried in order:

   a. **Binary file (PDF or image), primary path.** Base64-encode the file's bytes exactly as they are — never re-encode a screenshot, transcription, or summary — and call `well_upload_statement_bytes`. When your environment can compute a SHA-256 of the source bytes before encoding (for example, you have code execution or a file-reading tool), send it as `sha256` so the server's own decode is checked against it and a mismatch is caught immediately; when it can't, omit it and rely on the server's returned `content_sha256`/`byte_length` for the fidelity check in step 5. Only for files up to the tool's 5 MiB decoded cap.

   b. **Text file (CSV/XML/TXT), or the binary file didn't fit rung (a).** Call `well_upload_statement_content` with the file's content passed through exactly as received — never reformat, summarize, re-order, or fill in a row from memory. This tool is best-effort fidelity by construction: what Well ingests is what you relayed, not a byte-verified copy, which is why the response's `content_sha256`/`byte_length` matter (report them in step 5). PDFs and images never go here — the model cannot relay their bytes faithfully as text.

      **Model-transcription last resort.** When rung (a) is unavailable or fails for a PDF/image, and the statement's transactions are directly readable in this conversation, you may transcribe them (date, payee, amount, and whatever else is visible) into a clean CSV and upload that through `well_upload_statement_content`. Tell the user plainly, in the same message, that this is a transcription you produced from reading the file, not the original file's own data — never present a transcribed import as if it came from the source bytes.

   c. **The file is too large for both tools, or they are failing, and this host genuinely has shell access with open egress.** Call `well_create_statement_upload`, then POST the raw file bytes to its `upload_url` with `Authorization: Bearer <token>` yourself. Never echo the bearer token into anything you say to the user — it authorizes one upload and is meant to stay off the page. Most hosts do not have this capability; do not assume it does without confirming the host can actually shell out and reach the internet.

   d. **None of the above hold.** Point the user to the Well web app to upload the statement there directly instead — `<well-app-base-url>/workspaces/<workspace_id>`, nothing appended. Never invent a deeper path or a query parameter this skill has not verified.

   If a call in rung (a) or (b) fails ambiguously — a network or timeout error where it's unclear whether the server actually received it — retry the exact same call once rather than escalating to the next rung; the write carries its own idempotency key, so a call that already landed is deduplicated server-side rather than double-imported. If rung (c) already minted a `document_id` before an ambiguous POST outcome, poll `well_get_statement_import_result` with that pre-allocated id FIRST — a second mint burns a second token unnecessarily, and a poll can already tell you the first attempt landed.

   Once an upload call in rung (a) or (b) succeeds, or rung (c)'s POST has landed, the returned `document_id` is in hand and the import is under way. On a host that renders cards, the upload's own result has already put the import's waiting card on screen; move straight to the poll — the user watches the card while you poll.

4. **Poll for the outcome, every few seconds, in the same turn.** Call `well_get_statement_import_result({ document_id })` every 2-5 seconds at first, backing off to about every 10 seconds, under a bounded total timeout — a few minutes is enough for a single statement. The card the user is watching is the live picture of this import: each result you read is already refreshing on their screen, so the loop is never a silent stretch saved for one final dump. On a text-only host there is no card: narrate the status as it changes instead. `not_found_yet` right after rung (c)'s mint, before the client has posted the file, is normal, not an error; keep polling briefly. The completion report comes once, at the terminal status, alongside the card the user has been watching — the card refreshes itself as extraction and promotion complete, and the poll serves your narration of the outcome, never the card's rendering. If the timeout is reached before a terminal status, say so plainly and give the user the last state you saw rather than a silent stop; on a host that drew the card, it keeps updating on its own either way.

5. **Report the outcome.** See Output requirements below for exactly what to state.

## Output requirements

Return:

- Which transport rung was used, and why (for example, the file was a PDF under 5 MiB, so it went through `well_upload_statement_bytes`).
- The fidelity echo from the upload response — `content_sha256` and `byte_length` of what the server actually received — so a corrupted or mangled relay is visible rather than silently assumed away. If a transcription (step 3b's last resort) was used, say so explicitly here too, not just in the moment it happened.
- The terminal (or last-seen, on timeout) status from the poll, in plain language, plus the four counts when present — matched, pending review, newly imported, already present — using the tool's own null-means-unmeasured semantics: an absent count is unknown, never reported as zero.
- On `needs_account`: tell the user the statement needs an account link before it can import, and point them to the Well app to pick the account — `<well-app-base-url>/workspaces/<workspace_id>`, nothing appended. There is no MCP tool that resolves this account link, so do not invent one.
- `deduplicated: true` on the upload response, or a terminal `duplicate` status, both mean the same statement was already imported — say so plainly rather than reporting a fresh import.
- No connector coverage line the way a read skill would give one: this import needs no bank, accounting, or invoicing connection, and none was checked. If it's useful context, note that connecting a bank (`connect-bank`) gets these transactions in automatically going forward, instead of one file at a time.
- A one-line pointer to `close-books` for reconciling these transactions into a month-end close.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- If step 2's refusal fired (the file dropped out of context), or step 3's rung (d) was the only option, say so plainly rather than reporting a successful import that didn't happen.

**How this reaches the user.** Both upload tools and the poll tool ship a widget. On a host that renders MCP-Apps resources — Claude Desktop, for example — the upload's own result puts the import's recap card on screen, and each poll result keeps it current through processing to the final counts: the card the user watches is the live import, and the text report lands beside it at the terminal status. That behavior is host-decided and this skill cannot detect it, so state every count, status, and fidelity figure in text regardless of whether a card also drew them. Never claim the widget rendered in claude.ai's browser client, or in any host this skill has not verified draws it — text narration is the one result surface every host shows for certain.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from the pinned hand-off, and its `workspace_id` rode every `well_*` call.
- The statement's content (text or bytes) was verified as still verbatim-present in context before any upload call — never reconstructed from memory after it had dropped out.
- A binary file (PDF/image) never went through `well_upload_statement_content`, and text content was never base64-encoded through `well_upload_statement_bytes`.
- Text content passed to `well_upload_statement_content` was relayed exactly as received — no reformatting, reordering, or invented rows.
- A model-transcribed import (step 3b's last resort) was clearly labeled to the user as a transcription, not the original file.
- An ambiguous failure on rungs (a)/(b) was retried once on the same call before escalating rungs; an ambiguous rung (c) outcome was polled on its pre-allocated `document_id` before any re-mint.
- The bearer token from `well_create_statement_upload` never appeared in anything said to the user.
- `content_sha256` and `byte_length` from the upload response were reported, not silently dropped.
- The poll's four counts were reported using its own null-means-unmeasured semantics — never presented as zero when absent.
- `needs_account` and `duplicate`/`deduplicated` outcomes were reported plainly, with `needs_account` pointed at the Well app rather than an invented tool or deep link.
- The poll ran in the same turn as the upload, every few seconds with backoff until a terminal status. The card the user watched stayed live through every poll, the loop was never a silent stretch with one dump at the end, and the text report landed once, at the terminal status. On a text-only host, the status was narrated as it changed.
- No connector check was performed or implied as a precondition for this skill.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation.

## Examples

### Example request

The user pastes a CSV export from their bank directly into the chat and asks to import it.

### Expected behavior

Pin the workspace, confirm the CSV's rows are directly visible in the conversation, call `well_upload_statement_content` with the filename and the exact text (no reformatting), then poll `well_get_statement_import_result` every few seconds with backoff — the waiting card on screen updating live as you poll — until it reaches `imported` (or another terminal status), then report the returned `content_sha256`/`byte_length` alongside the matched / pending-review / new / already-present counts plus a pointer to `close-books`.

### Example request

The user drops a 2 MB PDF bank statement into the conversation and asks to import it.

### Expected behavior

Pin the workspace, confirm the PDF's bytes are available to encode, base64-encode them exactly and call `well_upload_statement_bytes` with the filename (compute and send `sha256` if the environment allows it), then poll with backoff to a terminal status — the waiting card on screen updating live as you poll — and report the outcome the same way as the CSV example, fidelity echo included.

### Example request

The user asks to import an OFX file exported from their bank's website.

### Expected behavior

Say plainly that OFX is not a supported format for this skill, name the formats that are (CSV, XML, TXT, PDF, or an image), and ask the user for one of those instead of attempting the upload.

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

---
name: import-bank-statement
description: Import a bank statement file into Well as real transaction records, matched against existing data and promoted into the workspace. Use when the user asks to import a bank statement, upload their statement, add bank transactions from a file, import a bank CSV or PDF, reconcile a bank export, or drops a statement file into the conversation. Accepts .csv, .xml, .txt (text) and .pdf, .jpg, .jpeg, .png, .gif, .heic, .heif, .avif, .webp (image) statement exports; OFX, QIF, and MT940 files are not supported, and this skill says so instead of failing silently. Needs no connector — the uploaded file is the data source itself, so this runs on a fresh Well workspace with nothing connected yet.
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
- Or simply drops a statement file (CSV, XML, TXT, PDF, or image) into the conversation without further explanation — a dropped-in bank export is itself the request.

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

1. **Pin the workspace.** {{> define-workspace purpose="to import your bank statement"}}

2. **Confirm you actually have the statement in hand, verbatim.** Before picking a transport, make sure the file's content (its text, or its raw bytes) is still directly present in this conversation's context, not a memory of having seen it earlier. In a long-running conversation an earlier attachment can drop out of context entirely — if that has happened, do not reconstruct the statement from memory or from your own earlier narration of it: refuse the upload and fall to rung (d) below instead, telling the user plainly that you no longer have the file and asking them to attach it again or use the Well app directly.

3. **Pick the transport rung, tool-first** — the rung that moves the file with the fewest round trips and the least risk of a mangled relay, tried in order:

   a. **Binary file (PDF or image), primary path.** Base64-encode the file's bytes exactly as they are — never re-encode a screenshot, transcription, or summary — and call `well_upload_statement_bytes`. When your environment can compute a SHA-256 of the source bytes before encoding (for example, you have code execution or a file-reading tool), send it as `sha256` so the server's own decode is checked against it and a mismatch is caught immediately; when it can't, omit it and rely on the server's returned `content_sha256`/`byte_length` for the fidelity check in step 5. Only for files up to the tool's 5 MiB decoded cap.

   b. **Text file (CSV/XML/TXT), or the binary file didn't fit rung (a).** Call `well_upload_statement_content` with the file's content passed through exactly as received — never reformat, summarize, re-order, or fill in a row from memory. This tool is best-effort fidelity by construction: what Well ingests is what you relayed, not a byte-verified copy, which is why the response's `content_sha256`/`byte_length` matter (report them in step 5). PDFs and images never go here — the model cannot relay their bytes faithfully as text.

      **Model-transcription last resort.** When rung (a) is unavailable or fails for a PDF/image, and the statement's transactions are directly readable in this conversation, you may transcribe them (date, payee, amount, and whatever else is visible) into a clean CSV and upload that through `well_upload_statement_content`. Tell the user plainly, in the same message, that this is a transcription you produced from reading the file, not the original file's own data — never present a transcribed import as if it came from the source bytes.

   c. **The file is too large for both tools, or they are failing, and this host genuinely has shell access with open egress.** Call `well_create_statement_upload`, then POST the raw file bytes to its `upload_url` with `Authorization: Bearer <token>` yourself. Never echo the bearer token into anything you say to the user — it authorizes one upload and is meant to stay off the page. Most hosts do not have this capability; do not assume it does without confirming the host can actually shell out and reach the internet.

   d. **None of the above hold.** Point the user to the Well web app to upload the statement there directly instead — `<well-app-base-url>/workspaces/<workspace_id>`, nothing appended. Never invent a deeper path or a query parameter this skill has not verified.

   If a call in rung (a) or (b) fails ambiguously — a network or timeout error where it's unclear whether the server actually received it — retry the exact same call once rather than escalating to the next rung; the write carries its own idempotency key, so a call that already landed is deduplicated server-side rather than double-imported. If rung (c) already minted a `document_id` before an ambiguous POST outcome, poll `well_get_statement_import_result` with that pre-allocated id FIRST — a second mint burns a second token unnecessarily, and a poll can already tell you the first attempt landed.

   Once an upload call in rung (a) or (b) succeeds, or rung (c)'s POST has landed, the returned `document_id` is in hand and the import is under way. On a host that renders cards, the upload's own result has already put the import's waiting card on screen — it carries the processing state visually; the next step is the poll.

4. **Poll for the outcome, every few seconds, until a terminal status.** Call `well_get_statement_import_result({ document_id })` every ~3-5 seconds at first, backing off to ~10 seconds, with a bounded total timeout — a few minutes is enough for a single statement. Poll in the same turn on EVERY host: the card on screen updates itself on each poll as extraction and promotion run, so the user watches progress live; on a text-only host, narrate the status as it changes. `not_found_yet` right after rung (c)'s mint, before the client has posted the file, is normal, not an error; keep polling briefly. When the status turns terminal, show the result: on a card host the card is already displaying the recap — narrate the counts and the fidelity echo alongside it; on a text-only host the narration is the result. If the timeout is reached before a terminal status, say so plainly and give the user the last state you saw rather than a silent stop; on a host that drew the card, it keeps updating on its own either way.

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

**How this reaches the user.** Both upload tools and the poll tool ship a widget. On a host that renders MCP-Apps resources — Claude Desktop, for example — the upload's own result already puts the import's recap card on screen, and it updates itself through processing to the final counts with no further calls from you; that behavior is host-decided and this skill cannot detect it, so state every count, status, and fidelity figure in text regardless of whether a card also drew them. Never claim the widget rendered in claude.ai's browser client, or in any host this skill has not verified draws it — text narration is the one result surface every host shows for certain.

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
- The poll ran every few seconds with backoff until a terminal status, on every host — the card updated live through processing on card hosts, and the outcome was shown to the user at completion, not only after a silent wait.
- No connector check was performed or implied as a precondition for this skill.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation.

## Examples

### Example request

The user pastes a CSV export from their bank directly into the chat and asks to import it.

### Expected behavior

Pin the workspace, confirm the CSV's rows are directly visible in the conversation, call `well_upload_statement_content` with the filename and the exact text (no reformatting), report the returned `content_sha256`/`byte_length`, then poll `well_get_statement_import_result` every few seconds until it reaches `imported` (or another terminal status) — the import card updating live on screen through processing — and report the matched / pending-review / new / already-present counts plus a pointer to `close-books`.

### Example request

The user drops a 2 MB PDF bank statement into the conversation and asks to import it.

### Expected behavior

Pin the workspace, confirm the PDF's bytes are available to encode, base64-encode them exactly and call `well_upload_statement_bytes` with the filename (compute and send `sha256` if the environment allows it), report the fidelity echo, then poll every few seconds to a terminal status and report the outcome the same way as the CSV example.

### Example request

The user asks to import an OFX file exported from their bank's website.

### Expected behavior

Say plainly that OFX is not a supported format for this skill, name the formats that are (CSV, XML, TXT, PDF, or an image), and ask the user for one of those instead of attempting the upload.

## Voice
{{> voice}}

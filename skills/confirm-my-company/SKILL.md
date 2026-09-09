---
name: "confirm-my-company"
description: "Resolve which company in a Well workspace is the user's own legal entity — the `own_company` pointer that decides which side of an invoice is a payable and which is a receivable — fold in its duplicate records, and hand the confirmed identity off as a typed result; and, when asked to persist it, set the anchor via `well_set_own_company` on the user's explicit confirmation. Use when a Well skill needs to tell its own invoices from a counterparty's, when the user asks \"which company is mine\" or \"set our company to X\", or when `workspaces.own_company` is null, missing from the schema, or ambiguous. Setting the anchor is an accounting-critical, admin-only write, taken only on an explicit confirmation and never inferred. Do not use to pick the workspace, to look up an arbitrary company by name, to merge or edit duplicate company records in Well, or to compute any financial figure."
license: PolyForm-Perimeter-1.0.0
---

# Confirm your company

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "confirm-my-company" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

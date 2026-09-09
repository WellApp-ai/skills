---
name: "assign-missing-invoices"
description: "Assign the settled expense transactions in one Well workspace that still have no supplier invoice for a month to a set of owners, split into no owner set, yours, and owned by others. Renders Well's owner-assignment card, one row per transaction with its owner set and a multi-select picker; picking owners replaces the set on that line, and several lines can take the same set at once. Assigning a (counterparty × month) gap to several people holds one task per owner, and one invoice resolves them all. Use when the user asks to assign missing invoices, \"who owns these missing receipts\", \"assign these to Marie and Théo\", or \"assign these to me\", or when a close-books flow needs expense ownership sorted. Assigns among workspace members only. Needs define-workspace, define-period, and a connected bank. Do not use to fetch or collect documents (fetch-missing-invoices, deploy-agents), to list gaps by counterparty or pick vendors to chase (show-missing-invoices), or to assign someone not in the workspace."
license: PolyForm-Perimeter-1.0.0
---

# Assign missing invoices

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "assign-missing-invoices" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

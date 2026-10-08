---
name: "check-reconciliation"
description: "Check whether the bank and the books match for one month, or for every open month, and re-run the steps that missed rows: the invoice matching and the posting. Use when the user asks \"do my bank and my books match\", \"compare ma banque et la compta d'août\", \"ma banque et ma compta collent ?\" or \"corrige les écarts\". It reports what matched, what posted and what is blocked, from Well's own ledger. This is a WRITE flow: it re-runs the invoice matching and the posting on your ask; on \"ne modifie rien\" it re-runs nothing and asks first. It sends nothing to the accounting tool and picks no category and no ledger account. Do not use to list missing invoices (that is `show-missing-invoices`), to close a month (that is `close-books`) or to compare against the records inside an accounting tool. Requires a connected bank in a company workspace; if none is connected, this skill guides the user to connect one first."
license: PolyForm-Perimeter-1.0.0
---

# Check bank and books

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "check-reconciliation" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

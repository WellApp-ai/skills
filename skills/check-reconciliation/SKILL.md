---
name: "check-reconciliation"
description: "Check whether the bank and the books match for one month or every open month, and re-run the steps that missed rows: the invoice matching and the posting. It reports what matched, what posted and what is blocked, from Well's own ledger. This is a WRITE flow: it re-runs the matching and the posting on your ask; on \"ne modifie rien\" it re-runs nothing and asks first. It sends nothing to the accounting tool and picks no category or ledger account. Use when asked \"do my bank and my books match\" or \"corrige les écarts\", not to close a month."
license: PolyForm-Perimeter-1.0.0
---

# Check bank and books

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "check-reconciliation" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

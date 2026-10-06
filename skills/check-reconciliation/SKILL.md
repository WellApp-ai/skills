---
name: "check-reconciliation"
description: "Check whether the bank and the books match for one month, or for every open month, and re-run the steps that missed rows: the invoice matching and the posting. Use when the user asks \"do my bank and my books match\", \"compare my bank and the books for August and fix the gaps\", \"ma banque et ma compta collent ?\", \"compare ma banque et la compta d'août\", or \"corrige les écarts\". It reports four facts: what matched, what posted, what is blocked, and what is not on the accounting tool yet. When nothing is wrong it answers in one line. It reads Well's own ledger, never the accounting tool's records. It sends nothing to the accounting tool and picks no category and no ledger account. Do not use it to fetch missing invoices, to close a month, or to compare against a register in an accounting tool."
license: PolyForm-Perimeter-1.0.0
---

# Check bank and books

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "check-reconciliation" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

---
name: "accounts-receivable-aging"
description: "Answer \"who owes us money, and since when?\" using Well's MCP financial graph — every outstanding customer invoice bucketed into standard aging bands (current, 1-30, 31-60, 61-90, 90+ days overdue), backed by real invoice data rather than guesswork. Use when the user asks \"who owes us money\", \"accounts receivable aging\", \"AR aging\", \"outstanding receivables\", \"which customers haven't paid\", \"who's late paying us\", or \"overdue invoices owed to us\". Requires a connected Well workspace with invoicing data and a resolvable `own_company`; if either is missing, this skill walks the user through connecting one or confirming their company first."
license: PolyForm-Perimeter-1.0.0
---

# Receivables aging

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "accounts-receivable-aging" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

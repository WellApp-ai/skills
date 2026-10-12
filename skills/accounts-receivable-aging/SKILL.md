---
name: "accounts-receivable-aging"
description: "Answer \"which customers owe us money, and since when?\" using Well's MCP financial graph: every outstanding customer invoice bucketed into aging bands (current, 1-30, 31-60, 61-90, 90+ days past due), read from synced invoice data rather than guessed. Use when the user asks \"accounts receivable aging\", \"AR aging\", \"outstanding receivables\", \"which customers haven't paid\", \"who's late paying us\", \"overdue invoices owed to us\", or who owes them money and how late they are. The broad, unqualified \"does anyone owe me money\", where supplier refunds, credits and VAT could count too, goes to money-back. A request that names Xero or QuickBooks goes to accounting-reports. It answers first from the invoices Well already holds. Well places the side of each invoice on the server; an invoice it cannot place is listed to check, with its issuer and receiver named, and nothing is asked about a company. A missing connection is asked for after the answer."
license: PolyForm-Perimeter-1.0.0
---

# Receivables aging

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "accounts-receivable-aging" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

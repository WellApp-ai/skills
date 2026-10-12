---
name: "accounts-payable-aging"
description: "Answer \"what do I owe my suppliers, and how overdue is it?\" using Well's MCP financial graph: every supplier bill still carrying a balance, sorted into aging bands (current, 1-30, 31-60, 61-90, 90+ days past due), read from synced invoice data rather than guessed. Use when the user asks \"accounts payable aging\", \"AP aging\", \"aged balance for suppliers\", \"aged creditors\", \"how overdue are our supplier bills\", \"what do we owe and since when\", \"which suppliers have we left unpaid the longest\", or \"balance âgée fournisseur\". For a date-ordered payment calendar instead of past-due bands, use `bills-due`. A request that names Xero or QuickBooks goes to accounting-reports. It answers first from the invoices Well already holds. Well places the side of each invoice on the server; an invoice it cannot place is listed to check, with its issuer and receiver named, and nothing is asked about a company. A missing connection is asked for after the answer."
license: PolyForm-Perimeter-1.0.0
---

# Payables aging

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "accounts-payable-aging" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

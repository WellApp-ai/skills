---
name: "supplier-spend-register"
description: "Rank what a workspace paid each supplier over a year, largest first, using Well's MCP financial graph, built from the purchase side of the synced invoices rather than an estimate. Use when the user asks \"how much did we pay each supplier last year\", \"supplier spend\", \"vendor spend report\", \"who are our biggest suppliers\", \"rank our vendors by spend\", \"supplier register\", or \"which suppliers did we pay over 600 last year\". The suppliers paid the most in one month from the bank are a cost-structure answer, not this one. The invoices Well cannot place on either side are counted and reported beside the total rather than dropped. Requires a connected Well workspace with invoicing or accounting data and the workspace's own company set; if either is missing, this skill walks the user through connecting one or confirming their company first. Asked about a refused payment, a price rise or a cancellation, it also notes what the person's own mails say on each supplier's row."
license: PolyForm-Perimeter-1.0.0
---

# Supplier spend register

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "supplier-spend-register" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

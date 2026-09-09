---
name: "rank-clients-by-ltv"
description: "Rank customers by total realized revenue paid to date — sum of paid invoices per customer — using Well's MCP financial graph, backed by real invoice data rather than guesswork. Use when the user asks \"rank our clients by lifetime value\", \"who are our best customers\", \"rank clients by revenue\", \"biggest customers\", \"customer lifetime value\", or \"which customers have paid us the most\". This is a realized-revenue ranking (paid invoices to date), not a predictive churn/retention-based LTV model. Requires a connected Well workspace with invoicing data and a resolvable `own_company`; if either is missing, this skill walks the user through connecting one or confirming their company first."
license: PolyForm-Perimeter-1.0.0
---

# Rank clients by LTV

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "rank-clients-by-ltv" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

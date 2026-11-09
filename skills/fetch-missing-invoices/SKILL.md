---
name: "fetch-missing-invoices"
description: "Use for \"what am I missing?\" (« il me manque quoi ? »), to get or plan a chase; no site named: \"what am I missing for March?\", « il me manque quoi pour octobre ? », \"get the invoices missing for March\", \"fetch the invoices I'm missing\", or for close-books. Shows the gaps and starts the fetch in one turn. Also to chase missing invoices or receipts. Walks Well's missing-invoice flow: workspace, fiscal year, months, bank feed or statement, categories, gap owners, vendors to chase, connectors, and Well's browser agents fetch that pick. A WRITE flow: a supplier Well lacks joins its catalog on your yes. A caller that fixed workspace, period and scope starts mid-flow. Also use when the user only asks to be reminded of each missing invoice: say Well sends no reminder per invoice and offer the list. Do not use to compute a spend total, close a period, run one brick alone, or when the person names the sites to get the invoices from: a task per named site (site-account-task, run-errands)."
license: PolyForm-Perimeter-1.0.0
---

# Missing invoice sweep

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "fetch-missing-invoices" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

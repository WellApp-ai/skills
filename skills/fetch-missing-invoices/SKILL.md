---
name: "fetch-missing-invoices"
description: "Walk Well's missing-invoice flow: workspace, fiscal year and currency, months, bank feed or statement, an accounting tool offer, counterparty categories, owners of settled lines missing invoices, settled spend with no supplier invoice, vendors to chase, connectors, and on Deploy Well's browser agents fetch that pick. Use on \"fetch the invoices I'm missing\" with no site named, \"chase my missing supplier invoices\" or \"run the missing-invoice flow\", or for close-books. It is click-chained and queues nothing until Deploy. It is a WRITE flow: a supplier Well lacks joins its catalog on your yes. A caller that fixed workspace, period and scope starts mid-flow. Also use when the user only asks to be reminded of each missing invoice: Well does not send a reminder per invoice; say so and offer the current list of missing invoices. Do not use to compute a spend total, close a period, run one brick alone, or when the person names the sites to get the invoices from: a task per named site (site-account-task, run-errands)."
license: PolyForm-Perimeter-1.0.0
---

# Missing invoice sweep

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "fetch-missing-invoices" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

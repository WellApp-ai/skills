---
name: "fetch-missing-invoices"
description: "Walk Well's missing-invoice flow end to end: pin the workspace, confirm fiscal year start and currency, fix the months, get the bank feed in or import a brought statement, offer an accounting tool if none is connected, categorize uncategorized counterparties, assign owners to settled lines missing invoices, list settled spend with no supplier invoice, pick vendors to chase, connect services Well has a connector for, and on Deploy queue Well's browser agents to fetch that pick. Use when the user says \"fetch the invoices I'm missing\", \"what am I missing for March\", \"chase my missing supplier invoices\", or \"run the missing-invoice flow\", or when close-books needs this remediation walked in order. The flow is click-chained (Use / Validate / Continue / Deploy) and queues nothing until Deploy. This is a WRITE flow: a supplier Well lacks joins its catalog on your yes. A caller that fixed the workspace, period and scope starts it mid-flow. Do not use to compute a spend total, close a period, or run one brick alone."
license: PolyForm-Perimeter-1.0.0
---

# Missing invoice sweep

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "fetch-missing-invoices" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

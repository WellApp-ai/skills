---
name: "fetch-missing-invoices"
description: "Walk Well's whole missing-invoice flow end to end — pin the workspace, fix the months, get the bank feed in, categorize the counterparties with no industry label, assign owners to the settled lines still missing an invoice, list the settled spend with no supplier invoice, take the user's pick of vendors to chase, connect the services Well holds a connector for, and on an explicit Deploy click queue Well's browser agents to fetch that pick. Use when the user says \"fetch the invoices I'm missing\", \"what am I missing for March\", \"chase my missing supplier invoices before I close\", or \"run the missing-invoice flow\", or when a flow like closing the books needs the missing-invoice remediation walked in order. The flow is click-chained (Use / Validate / Continue / Deploy clicks drive it) and queues nothing until the user clicks Deploy. A caller that already fixed the workspace, period and scope can start it mid-flow in composed mode. Do not use to compute a spend total, close a period, or run one brick alone."
license: PolyForm-Perimeter-1.0.0
---

# Missing invoice sweep

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "fetch-missing-invoices" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

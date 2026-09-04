---
name: fetch-missing-invoices
description: Walk Well's whole missing-invoice flow end to end — pin the workspace, fix the months, get the bank feed in when no bank transaction has landed, categorize the counterparties carrying no industry label, list the settled spend that still has no supplier invoice, take the user's pick of the vendors to chase, connect the services Well holds a connector for, and preview what Well would fetch for that pick. Nothing runs from the session. The last card hands the picked portals to the Well app's collect page, where the browser extension collects from them once the user starts it there. Use when the user says "fetch the invoices I'm missing", "what am I missing for March", "chase my missing supplier invoices before I close", or "run the missing-invoice flow", or when a flow needs every brick walked in order. The flow is click-chained — the cards' Use / Validate / Continue clicks drive it. Do not use to collect from the session, to compute a spend total, to close a period, or to run one brick alone.
---

# Fetch Missing Invoices with Well

This skill's instructions are served by Well's MCP server, so they are always current. The file you are reading is a stub.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.
2. Call `well_get_skill({ skill: "fetch-missing-invoices" })` and follow the returned content exactly; it is the authoritative instruction set. The flow has 7 steps. A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.
3. The result's `next.step` names the next call; when the step is complete, call `well_get_skill({ skill: "fetch-missing-invoices", step: <next.step> })`. A `next` of null ends the walk.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop; do not improvise from memory.

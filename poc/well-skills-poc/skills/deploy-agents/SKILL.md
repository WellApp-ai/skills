---
name: deploy-agents
description: Preview what Well would fetch for the vendors the user picked — which agents would run, over which counterparties and transactions, which rows need a manual upload, and which providers need connecting — then hand those vendors to the Well app. Nothing collects anything yet. The preview card gives a checkbox to each vendor the collect link names, and its primary action opens that link for the portals the user ticked. The Well browser extension collects from those portals, and only after the user starts them on that page. Use when the user asks to fetch, collect, or chase the invoices they are missing, says "launch the agents", "go get those invoices", "deploy the collectors", or when the fetch-missing-invoices flow reaches its last step after the missing rows have been listed and picked. Do not use to run a collection from the session, to invoke a connector's own actions, to create or edit an invoice, to connect a provider, or to list which invoices are missing in the first place.
---

# Deploy Agents with Well

This skill's instructions are served by Well's MCP server, so they are always current. The file you are reading is a stub.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.
2. Call `well_get_skill({ skill: "deploy-agents" })` and follow the returned content exactly; it is the authoritative instruction set. A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.
3. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop; do not improvise from memory.

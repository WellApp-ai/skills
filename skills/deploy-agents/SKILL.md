---
name: "deploy-agents"
description: "Preview what Well would fetch for the vendors the user picked — which agents would run, over which counterparties and transactions, which rows need a manual upload, and which providers need connecting — then, on the Deploy click, create the durable fetch tasks and hand the user the collect link that starts the runs. Nothing is queued until Deploy, and creating the tasks launches nothing — the Well browser extension collects only after the user opens the collect link. Use when the user asks to fetch, collect, or chase the invoices they are missing, says \"launch the agents\", \"go get those invoices\", \"deploy the collectors\", or when the fetch-missing-invoices flow reaches its last step after the missing rows have been listed and picked. Do not use to run a collection from the session, to invoke a connector's own actions, to create or edit an invoice, to connect a provider, or to list which invoices are missing in the first place."
license: PolyForm-Perimeter-1.0.0
---

# Invoice fetching agents

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "deploy-agents" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

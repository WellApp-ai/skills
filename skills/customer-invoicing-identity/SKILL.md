---
name: "customer-invoicing-identity"
description: "Answer \"do I have everything I need on this customer to invoice them properly?\" using Well's MCP context graph: the legal identity Well holds about one customer you bill, each value with where it came from, and the ones still blank. Use when the user asks \"what is this customer's SIREN\", \"do we have their VAT number\", \"what is missing on this customer before I invoice them\", \"check this customer's billing details\", \"is this customer's legal name on file\", or \"what do we hold on [customer name]\". Answers about one customer per call, reads only the workspace's own company records, and checks no public directory. Requires a connected Well workspace holding a company record for that customer."
license: PolyForm-Perimeter-1.0.0
---

# Customer invoicing identity

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "customer-invoicing-identity" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

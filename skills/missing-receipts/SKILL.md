---
name: "missing-receipts"
description: "Find invoices (and optionally transactions) with no source document attached — a compliance/expense-hygiene check backed by Well's MCP financial graph. Use when the user asks \"which expenses are missing receipts\", \"find missing receipts\", \"compliance check on receipts\", \"which invoices have no document attached\", \"do we have documentation for all our expenses\", \"missing documentation\", \"get the missing receipts\", \"here is a receipt\", \"match this receipt\" or \"voici le justificatif\". The list finds the gap. To get a missing receipt, Well hands it on: a named receipt goes to a saved browser skill when one covers the vendor, otherwise to the Chrome extension, which opens the vendor's site in the user's browser once the user starts it; a request for all missing receipts goes to Well's fetch flow. For a picked transaction it can draft an email to the vendor. It also matches a receipt photo or PDF to its expense. Requires a connected Well workspace. When a source is missing, it asks for the tool that adds the most."
license: PolyForm-Perimeter-1.0.0
---

# Missing receipts

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "missing-receipts" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

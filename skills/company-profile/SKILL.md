---
name: "company-profile"
description: "Compose everything Well knows about one named company — customer or vendor — into a single 360 view using Well's MCP financial graph — profile info, contact channels, and the invoice relationship (as issuer, receiver, or both). Use when the user asks \"build a customer 360 view\", \"customer 360\", \"give me a 360 view of X\", \"everything about [company name]\", \"vendor across every rail\", \"who is this company\", \"show me our history with X\", or \"tell me about our relationship with [vendor/customer]\". Requires a connected Well workspace with at least one connector that has synced company/invoice data; if none is connected or the company can't be found, this skill says so instead of guessing."
license: PolyForm-Perimeter-1.0.0
---

# Company profile

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "company-profile" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

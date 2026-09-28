---
name: "repost-journals"
description: "Check whether a fiscal period's transactions and invoices are posted to the ledger, and when a re-triggerable gap remains — rows that are ready to post and simply have not — surface a card whose one CTA re-runs the posting pipeline for the workspace. Use inside a close, or on its own to ask \"did the accounting post?\". Do not use to pick a ledger account, to categorize a transaction, or to resolve a party: those are substantive blockers this step never lists."
license: PolyForm-Perimeter-1.0.0
---

# Repost the journals

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "repost-journals" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

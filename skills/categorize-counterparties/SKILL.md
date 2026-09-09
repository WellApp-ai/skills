---
name: "categorize-counterparties"
description: "Raise category coverage on the counterparties (suppliers and customers) behind one Well workspace's spend — for a given month's still-missing invoices, or workspace-wide across everything still uncategorized. Renders Well's counterparties card, where each listed row carries a catalog-category select, every pick saves immediately, and Continue hands the turn back; the skill reads one list, points at the card, and proposes categories only when the user explicitly asks it to. Use when the user asks to categorize or tag their suppliers, vendors, or counterparties, says \"which suppliers have no category\", \"categorize the companies behind my spend\", \"clean up my vendor categories before I close the books\", or when a fetch-missing-invoices flow reaches its counterparty categorization step. Never invents a category outside the catalog. Do not use to categorize individual transactions, to compute a spend figure, or to connect a tool."
license: PolyForm-Perimeter-1.0.0
---

# Categorize your suppliers

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "categorize-counterparties" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

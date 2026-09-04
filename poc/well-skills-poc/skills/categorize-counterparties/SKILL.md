---
name: categorize-counterparties
description: Raise category coverage on the counterparties (suppliers and customers) behind one Well workspace's spend — for a given month's still-missing invoices, or workspace-wide across everything still uncategorized. Renders Well's counterparties card, where each listed row carries a catalog-category select, every pick saves immediately, and Continue hands the turn back; the skill reads one list, points at the card, and proposes categories only when the user explicitly asks it to. Use when the user asks to categorize or tag their suppliers, vendors, or counterparties, says "which suppliers have no category", "categorize the companies behind my spend", "clean up my vendor categories before I close the books", or when a fetch-missing-invoices flow reaches its counterparty categorization step. Never invents a category outside the catalog. Do not use to categorize individual transactions, to compute a spend figure, or to connect a tool.
---

# Categorize Counterparties with Well

This skill's instructions are served by Well's MCP server, so they are always current. The file you are reading is a stub.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.
2. Call `well_get_skill({ skill: "categorize-counterparties" })` and follow the returned content exactly; it is the authoritative instruction set. A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.
3. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop; do not improvise from memory.

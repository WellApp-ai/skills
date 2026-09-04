---
name: show-missing-invoices
description: List the settled spend in one Well workspace that still has no supplier invoice for a given month or fiscal period, one row per counterparty, each row carrying how the gap can be closed — Well's agent fetches it, connect the provider, or upload it by hand — and hand the list off as a typed result. The card carries a checkbox per vendor, and its Continue click writes the picked vendors into the session as identifiers so the fetch step acts on the user's pick. Use when the user asks which invoices or receipts are missing, "what am I missing for March", "which vendor invoices do I still owe my accountant", "show me the gaps before I close the books", or when a close-books or fetch-missing-invoices flow needs the period's gap list before it collects anything. Needs a workspace pinned by define-workspace and a period resolved by define-period. Do not use to fetch, download, or collect the documents themselves, to compute a spend total, or to list unpaid customer invoices.
---

# Show Missing Invoices with Well

This skill's instructions are served by Well's MCP server, so they are always current. The file you are reading is a stub.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.
2. Call `well_get_skill({ skill: "show-missing-invoices" })` and follow the returned content exactly; it is the authoritative instruction set. A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.
3. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop; do not improvise from memory.

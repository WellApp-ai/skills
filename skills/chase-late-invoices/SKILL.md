---
name: "chase-late-invoices"
description: "Rank overdue customer invoices by amount owed and lateness, look up each customer's contact info already stored in Well, and draft a ready-to-send chase message per customer, from real invoice data. It opens the draft as an email card; on WhatsApp it sends from the user's mailbox only after their tap on Confirmer. It answers first from the invoices Well holds. Use when asked \"who should I chase\" or for a late-payment email, not just who owes money."
license: PolyForm-Perimeter-1.0.0
---

# Chase late invoices

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "chase-late-invoices" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

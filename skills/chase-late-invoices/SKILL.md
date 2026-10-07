---
name: "chase-late-invoices"
description: "Rank overdue customer invoices by how much is owed and how late it is, look up each customer's contact info already stored in Well, and draft a ready-to-send chase message per customer, using Well's MCP financial graph and backed by real invoice data rather than guesswork. Use when the user asks \"who should I chase for payment\", \"draft a late-payment email\", \"who do I need to follow up with\", \"chase overdue invoices\", \"collections reminder\", or \"help me get paid faster\". It drafts the messages and, for each customer the user names or picks, opens the draft as an email card to review and send from their own mail app (not on WhatsApp, where the drafts stay in the chat); it never sends anything itself. Requires a connected Well workspace with invoicing data and a resolvable `own_company`; if either is missing, this skill walks the user through connecting one or confirming their company first."
license: PolyForm-Perimeter-1.0.0
---

# Chase late invoices

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "chase-late-invoices" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

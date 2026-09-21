---
name: "import-statement"
description: "Put a bank statement the user already has — a pdf, a csv, an ofx, an xml, or a photo of the page — through Well's own extraction, so the statement, its lines and the transactions behind them land as records in one Well workspace. Takes the file three ways: the claim token from a drop on Well's website, which collects every statement dropped together, an upload of bytes the user attaches to the conversation, or pasted text. Use when the user has a statement in hand and nothing connected yet, says \"read this statement\", \"import my bank statement\", \"I have a pdf of my account\", \"I dropped a file on your site\", or when a gap-list or close flow needs transactions for a period no connector covers. It is the cold-start on-ramp: the only Well skill that produces transactions without a bank connector. Do not use to connect a bank for ongoing sync — that is connect-bank — to read balances, or to list what invoices are missing."
license: PolyForm-Perimeter-1.0.0
---

# Import a statement

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "import-statement" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

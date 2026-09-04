---
name: connect-bank
description: Get a bank account connected to a Well workspace and confirm the feed is live — read which banks are already connected, still running their first sync, or in error, hand the user Well's one-click bank install link, and return a typed bank-coverage result to the flow that follows. Use when the user asks to connect a bank, link a bank account, add Qonto or a Plaid-supported bank, asks "is my bank connected", "why are my transactions missing", or when a Well skill needs settled bank spend in the workspace before it continues. Do not use to connect accounting or invoicing tools (that is connect-tools), to compute a figure, to force a re-sync, or to disconnect an account.
---

# Connect Bank with Well

This skill's instructions are served by Well's MCP server, so they are always current. The file you are reading is a stub.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.
2. Call `well_get_skill({ skill: "connect-bank" })` and follow the returned content exactly; it is the authoritative instruction set. A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.
3. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop; do not improvise from memory.

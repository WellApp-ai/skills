---
name: "call-and-claim"
description: "Claim a refund or a compensation from one business for one purchase or service, such as a delayed flight or an order never delivered. It reads the evidence in Well first, names a right only when every fact it needs is held, prepares the call as a script and writes the claim email. It places no call and sends nothing without the person's confirmation. Use to claim compensation or a refund, or for what to say on the call; not a subscription debit."
license: PolyForm-Perimeter-1.0.0
---

# Call and claim

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "call-and-claim" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

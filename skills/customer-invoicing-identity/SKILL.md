---
name: "customer-invoicing-identity"
description: "Check what Well holds on one customer you bill (legal name, SIREN, VAT number, address), where each value came from, and what is still blank. Use when asked \"what is this customer's SIREN\" or \"what is missing before I invoice them\"."
license: PolyForm-Perimeter-1.0.0
---

# Customer invoicing identity

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "customer-invoicing-identity" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

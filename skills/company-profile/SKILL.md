---
name: "company-profile"
description: "Compose everything Well knows about one named company, customer or vendor, into a single 360 view: profile info, contact channels, and the invoice relationship as issuer, receiver, or both. If the company can't be found, it says so instead of guessing. Use when asked \"customer 360\", \"everything about [company name]\" or \"who is this company\"."
license: PolyForm-Perimeter-1.0.0
---

# Company profile

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "company-profile" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

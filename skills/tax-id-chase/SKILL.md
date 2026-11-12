---
name: "tax-id-chase"
description: "List the companies in a Well workspace that carry no tax identifier on file, so the chase for a SIREN, a VAT number or a tax id happens before year end. This is a read: it shows one company's registry detail card, ranks nobody by amount paid and files nothing. Needs an accounting or invoicing connector. Use when asked \"which suppliers have no tax number\" or \"who has no SIREN on file\"."
license: PolyForm-Perimeter-1.0.0
---

# Tax id chase

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "tax-id-chase" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

---
name: "company-profile"
description: "Build or refresh the sourced dossier of one company: a supplier, a client, a bank, the member's own company, or a tool the workspace uses. It resolves the company and its duplicates first, reads what Well holds, the stored registry answer and each connected tool's record, then public registers, checks for wrong data, and returns a brief of at most 8 lines with gaps. It proposes merges, links and fixes and writes none without a yes. It answers \"brief me on this tool before the renewal\" and \"customer 360\". Not for a person (that is people-book) and not to pay a bill. Use for \"what do we know about this supplier\" or \"fiche de cette société\"."
license: PolyForm-Perimeter-1.0.0
---

# Company profile

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "company-profile" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

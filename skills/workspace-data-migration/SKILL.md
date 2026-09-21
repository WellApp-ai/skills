---
name: "workspace-data-migration"
description: "Bring a bank (or other ledger) connector across from a Well company workspace's lineage parent — its membership/signup workspace — to the company workspace itself, over Well's MCP server, on a card the user confirms. Use it in the close-books bank step when the company workspace holds no bank transaction yet and a connector on its parent could follow it here (its account holder matches this company). It draws the connector-retarget card, the user picks which connectors to bring across, and Confirm mints a borrowing connector row on this workspace that pulls the history in on its own first sync — the transactions are not moved. Keep for later brings nothing across and the flow continues to connect a bank. Requires a connected Well workspace and owner/admin rights, plus a membership on the parent workspace whose credentials the borrow consumes."
license: PolyForm-Perimeter-1.0.0
---

# Bring a connector across

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "workspace-data-migration" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

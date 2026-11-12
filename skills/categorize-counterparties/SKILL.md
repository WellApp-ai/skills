---
name: "categorize-counterparties"
description: "Raise category coverage on the counterparties (suppliers and customers) behind one workspace's spend, for a month's missing invoices or workspace-wide. It renders Well's counterparties card; every pick saves at once. It never invents a category outside the catalog. Use when asked to categorize suppliers or vendors, not transactions (unposted-and-blocked)."
license: PolyForm-Perimeter-1.0.0
---

# Categorize your suppliers

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "categorize-counterparties" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

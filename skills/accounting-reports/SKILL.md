---
name: "accounting-reports"
description: "Read a profit and loss, balance sheet or cash flow statement from the user's connected QuickBooks, Xero or Pennylane, and state its key lines with their source. Pennylane shares only its trial balance, so Well computes the totals from it. Use for \"show me my P&L\" or any report naming QuickBooks, Xero or Pennylane."
license: PolyForm-Perimeter-1.0.0
---

# Accounting reports

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "accounting-reports" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

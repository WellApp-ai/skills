---
name: "accounting-reports"
description: "Read a profit and loss, balance sheet or cash flow statement straight from the user's connected QuickBooks or Xero, and state its key lines as the accounting tool returned them. Use when the user asks \"show me my P&L\", \"profit and loss for last quarter\", \"income statement\", \"what does my balance sheet say\", \"the cash flow statement from QuickBooks\", or names QuickBooks or Xero for any report, an aged payables or aged receivables report from QuickBooks included. An aged payables or receivables question that names no tool belongs to accounts-payable-aging or accounts-receivable-aging instead, and a cash bridge from the bank feed belongs to cash-flow-waterfall. Requires a connected QuickBooks or Xero in a Well workspace; if none is connected, or the connection needs a reconnect, it offers the link that fixes it. It reads the report the tool returns and never recomputes it: QuickBooks reports come for QuickBooks' own default period, and Xero shares only its profit and loss and its balance sheet with Well."
license: PolyForm-Perimeter-1.0.0
---

# Accounting reports

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "accounting-reports" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

---
name: "accounting-settings"
description: "Set a Well workspace's accounting settings — the fiscal year start month above all, plus the first fiscal year start date, home/base currency, country, accounting framework, and chart-of-accounts confirmation — over Well's MCP server, writing only the value the user confirms, never a guessed one. Use when the user asks to \"set our fiscal year start\", \"our accounting year starts in April\", \"change the reporting currency\", \"set the accounting framework\", \"confirm the chart of accounts\", or when a close or period-scoped flow needs the fiscal year start confirmed before it derives fiscal periods. This is a WRITE flow — it shows the current value where it can read one, confirms the new one, then writes; the fiscal year start is refused when a period is locked or a close is in progress, and changing it discards regenerable draft journal entries. Requires a connected Well workspace and owner/admin rights; it never touches the own-company identity — that is `confirm-my-company`."
license: PolyForm-Perimeter-1.0.0
---

# Accounting settings

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "accounting-settings" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

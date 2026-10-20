---
name: "money-leak-finder"
description: "Scan a workspace's recent bank debits for money leaks using Well's MCP financial graph, then list the charges to check: duplicate charges, silent price rises on fixed-price subscriptions, and new recurring vendors that crept in. Use when the user asks \"where am I losing money\", \"find double charges\", \"did any vendor raise their price\", \"what new subscriptions crept in\", \"review my spending for overpayments\", \"find wasted spend\", or \"what am I paying for that I should not be\". Charges are grouped by the vendor company and never by memo text, and every line carries the vendor, the dates, the amounts and the currency. It does not detect charges that continued after a cancellation, because Well holds no cancellation date. Requires a connected Well workspace with a bank; if it is missing, this skill walks the user through connecting one first."
license: PolyForm-Perimeter-1.0.0
---

# Money leak finder

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "money-leak-finder" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

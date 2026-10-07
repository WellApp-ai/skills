---
name: "contractor-year-end-statements"
description: "Read the purchase invoices for one calendar year, list every contractor and supplier you paid with the total for each, name the ones carrying no tax identifier on file, and say which year-end statement each jurisdiction expects and roughly when, over Well's MCP business graph. Use when the user asks \"who do I owe a 1099 this January\", \"1099-NEC list\", \"who needs a W-9\", \"DAS2\", \"fiche 281.50\", \"Certificazione Unica\", \"Modelo 190\", \"contractor year end\", or \"which freelancers did I pay last year\". Requires a connected Well workspace with invoicing or accounting data and the workspace's own company confirmed, because the purchase side is resolved from it. This skill never files: it produces the recipient list and the per-recipient totals, and the founder, the accountant or the filing engine submits. Every figure is gross, no reporting threshold is applied, and amounts are never split by payment rail."
license: PolyForm-Perimeter-1.0.0
---

# Contractor year end statements

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "contractor-year-end-statements" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

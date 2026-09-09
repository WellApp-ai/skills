---
name: "normalize-currency"
description: "Turn a set of amounts in different currencies into one auditable answer — either a single converted total carrying the exchange rate and as-of date behind it, or a clean per-currency breakdown — and never a blended figure. Use when a Well skill has totals spanning more than one currency, needs a rate from the `exchange_rates` root, or must state which date's rate a converted number used. Do not use when a Well tool already returned a converted figure, to fetch live market rates from outside Well, or to compute any business metric."
license: PolyForm-Perimeter-1.0.0
---

# Convert currencies

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "normalize-currency" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

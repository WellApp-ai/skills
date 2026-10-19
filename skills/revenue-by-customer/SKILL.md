---
name: "revenue-by-customer"
description: "Rank the customers a workspace billed in one period, using Well's MCP financial graph, read off the invoices this workspace issued rather than guessed. Use when the user asks \"revenue by customer\", \"how much did each customer bill me for last month\", \"who was my biggest customer in March\", \"customer revenue breakdown\", \"revenue split by client\", or \"top billed customers this period\". It answers first from the invoices Well already holds. Well places the side of each invoice on the server; when it cannot, the answer lists the largest invoices of the period on both sides to check, ranks no customer from them, and asks nothing about a company. A missing connection is asked for after the answer."
license: PolyForm-Perimeter-1.0.0
---

# Revenue by customer

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "revenue-by-customer" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

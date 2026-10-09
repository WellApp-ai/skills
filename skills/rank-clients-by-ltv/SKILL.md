---
name: "rank-clients-by-ltv"
description: "Rank customers by their revenue lifetime value (LTV): average order value x monthly purchase frequency x expected lifespan, measured by Well over up to five years of issued invoices and drawn as a bar chart, one bar per customer. Use when the user asks \"rank our clients by lifetime value\", \"who are our best customers\", \"customer lifetime value\", \"what is a customer worth to us\", \"biggest customers over their life\", \"which customers are worth the most\", \"mes meilleurs clients sur la durée\", \"valeur vie client\" or \"classe mes clients par valeur\". It is a revenue LTV with no margin applied, and the lifespan comes from the churn Well observes in the invoices. It answers first from the invoices Well holds: until the own company is stored in Well, it lists the largest invoices of the window on both sides, ranks no customer, and asks which company is the user's own on its last line."
license: PolyForm-Perimeter-1.0.0
---

# Rank clients by LTV

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "rank-clients-by-ltv" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

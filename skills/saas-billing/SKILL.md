---
name: "saas-billing"
description: "Read subscriptions, cancellations, failed payments and refunds live from the billing tool a workspace connected (Stripe, Paddle or Lago), and write the rows as text with the status each provider gave. Disputes come from Paddle and Lago only. It asks for a time window before a large read, reads only and saves nothing. Needs one of those tools connected; if none is, it offers to connect one. Use when asked \"who cancelled this month\" or \"which payments failed\", not for MRR (mrr)."
license: PolyForm-Perimeter-1.0.0
---

# SaaS billing

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "saas-billing" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

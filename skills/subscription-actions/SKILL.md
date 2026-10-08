---
name: "subscription-actions"
description: "Act on one subscription the person names: cancel it, ask for a lower price, or contest a double debit. It reads the supplier's bank debits first and states the facts behind the action. A cancellation or a contest goes first to the Well browser extension on the supplier's own site; the email to the supplier is the fallback, and a price request is an email. Several workspaces go in rounds, from the personal one. A cancellation puts the notice date and the end of service first, from a contract on file only. A double debit is always marked \"to check\", with the bank dispute steps. Use when the user asks \"résilie mon abonnement Notion\", \"cancel my Notion subscription\", \"négocie le prix de mon abonnement\", \"ask for a lower price\", \"conteste le double prélèvement Figma\", \"I was charged twice for this subscription\" or \"write to the supplier to stop the subscription\". Not for insurance (use insurance-switch). It never promises an amount and starts or sends nothing without the person's confirmation."
license: PolyForm-Perimeter-1.0.0
---

# Subscription actions

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "subscription-actions" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

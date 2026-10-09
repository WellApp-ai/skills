---
name: "unposted-and-blocked"
description: "List what one month has not booked yet, in two piles: the transactions with no category, and the transactions that carry a category or a ledger role and still have no ledger account to post to. Use when the user asks \"what in March has not made it into the books\", \"what has not posted yet\", \"which transactions are still uncategorized\", \"categorize my transactions\", \"aide-moi à catégoriser mes transactions\", \"propose-moi des catégories sans rien modifier\", \"what is my bookkeeper going to have to book by hand\", or when a close flow needs a period's two repair worklists. Needs a workspace, a bank connector and a month; a categorize ask with no month reads the last complete month and the running month, and says so. It is a read: the cards set the categories. A categorize ask reads the uncategorized pile alone, and one that refuses any change lists the proposals in text with no card."
license: PolyForm-Perimeter-1.0.0
---

# Unposted and blocked

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "unposted-and-blocked" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

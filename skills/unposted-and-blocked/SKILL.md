---
name: "unposted-and-blocked"
description: "List what one month has not booked yet, in two separate piles: the transactions that carry no category at all, and the transactions that already carry a category or a ledger role and still have no ledger account to post to. Use when the user asks \"what in March has not made it into the books\", \"what has not posted yet\", \"which transactions are still uncategorized\", \"what is my bookkeeper going to have to book by hand\", \"what is blocking the close\", or when a close flow needs a period's two repair worklists before it goes on. Needs a workspace pinned by define-workspace, a bank connector behind the month, and a period resolved by define-period. This is a read: it lists the rows and the cards take the fixes. It reports two counts and never one, gives no per-row reason for a stuck row, states no amount, and reads a page that filled as a floor rather than as a total."
license: PolyForm-Perimeter-1.0.0
---

# Unposted and blocked

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "unposted-and-blocked" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

---
name: "mailbox"
description: "Summarize the important mail observed this week, find the last mail from one sender (named by an address or a role such as the accountant), or list the threads that still wait for the member's reply, from Well's records. Also across WhatsApp, Instagram or LinkedIn: Well answers from the mail and says it does not read those apps. It reads the member's own notes and person records and applies their private skipped-sender choices. It also answers what a meeting said or decided, also when the ask names no recorder, from the summaries a meeting recorder (Fathom, Granola, Circleback, Plaud) sent by mail when it is not connected, else the matching calendar event. A read-only question about the member's own mail needs no yes first. It writes no mail or commitment. Use for \"who am I late replying to\" or \"my accountant's last mail\"; newsletters: mail-senders."
license: PolyForm-Perimeter-1.0.0
---

# Mailbox

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "mailbox" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

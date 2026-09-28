---
name: "context-graph"
description: "Build a Well workspace's context graph from a conversation. Connects Well to the user's AI apps when none is connected yet, gets the bank, accounting and invoicing sources connected with Well's connect card, recaps in one line per source what was connected or skipped, then draws the context graph those sources feed. Use when the user asks to \"build my context graph\", \"set up my context graph\", \"show me my context graph\", \"connect Well to my AI apps\", or wants to see how their business data connects. Needs define-workspace and connect-tools. Do not use to compute a figure, to check coverage for another skill (that is connect-tools), to explore one company's links (draw the graph directly), or to invite a teammate (invite-teammates)."
license: PolyForm-Perimeter-1.0.0
---

# Build your context graph

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "context-graph" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

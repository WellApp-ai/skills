---
name: "context-graph"
description: "Build a Well workspace's context graph from a conversation: connect Well to the user's AI apps when none is connected, get the bank, accounting and invoicing sources connected with Well's connect card, recap each source in one line, then draw the context graph those sources feed. Needs define-workspace and connect-tools. Use when asked to \"build my context graph\", not for one AI app (connect-tools)."
license: PolyForm-Perimeter-1.0.0
---

# Build your context graph

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "context-graph" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

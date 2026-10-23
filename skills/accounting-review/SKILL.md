---
name: "accounting-review"
description: "Work through the open accounting items of a Well workspace with the member, one category at a time. Propose each match, gap or review and resolve it with its own write tool, or hand a web-only item back with its link. This is a WRITE flow where each resolution goes through the write gate, which asks the member to confirm it unless the run's approved settings say otherwise. Use when the user asks \"work through my accounting items\", \"handle my accounting items\" or \"/accounting-review [category]\"."
license: PolyForm-Perimeter-1.0.0
---

# Accounting review

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "accounting-review" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

---
name: "define-period"
description: "Pin the calendar month or months — with their fiscal coordinates — a Well workspace job works on, written server-side by the user's click on the period picker card, and hand the selection off as a typed result; or, in `collect` mode, hand one month's coordinates back to a caller that commits the period by starting a run, where naming the month is starting and this skill writes no commit. Use when the user says \"last month\", \"March\", \"2026-03\", \"the period we're working on\", asks which month a job covers, when a Well skill needs the period fixed before it reads data, or when a close or other start-a-run flow needs one month collected first. Defaults to the last complete month, refuses a month that has not ended, derives fiscal coordinates from the workspace's fiscal-year start month, and reports whether the selection has any activity. Do not use to close, lock, or reopen a period, to run a month-end close, to resolve which workspace the conversation is about, or to list what is missing inside the month."
license: PolyForm-Perimeter-1.0.0
---

# Pick the period

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "define-period" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.

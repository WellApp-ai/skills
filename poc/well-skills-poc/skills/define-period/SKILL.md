---
name: define-period
description: Pin the calendar month or months — with their fiscal coordinates — a Well workspace job works on, written server-side by the user's click on the period picker card, and hand the selection off as a typed result; or, in `collect` mode, hand one month's coordinates back to a caller that commits the period by starting a run, where naming the month is starting and this skill writes no commit. Use when the user says "last month", "March", "2026-03", "the period we're working on", asks which month a job covers, when a Well skill needs the period fixed before it reads data, or when a close or other start-a-run flow needs one month collected first. Defaults to the last complete month, refuses a month that has not ended, derives fiscal coordinates from the workspace's fiscal-year start month, and reports whether the selection has any activity. Do not use to close, lock, or reopen a period, to run a month-end close, to resolve which workspace the conversation is about, or to list what is missing inside the month.
---

# Define Period with Well

This skill's instructions are served by Well's MCP server, so they are always current. The file you are reading is a stub.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.
2. Call `well_get_skill({ skill: "define-period" })` and follow the returned content exactly; it is the authoritative instruction set. A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.
3. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop; do not improvise from memory.

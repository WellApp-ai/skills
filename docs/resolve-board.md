<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Open a saved board

**A board you saved, drawn with today's figures rather than the day it was built.**

## What it does

A board in Well stores a QUESTION, not an answer. Each block carries the feed it draws and the window it asks that feed for, and no figure is saved anywhere.

That is what makes a board safe to keep, and it is also why opening one is real work. This skill does that work: it reads the board, runs each block's own measure over that block's own window, and draws the result.

The measures are not recomputed here in some shortcut form. A cash position is the cash position skill's answer, under its rules about which accounts count. An average burn is the burn skill's answer, under its rules about which months are finished. Reading a board is the same set of answers you would get by asking for each measure one at a time, laid out the way you arranged them.

Nothing is written back. Open the same board tomorrow and every figure on it is tomorrow's, which is why no block on it carries a date: there is no stored number for a date to qualify.

Before it measures anything, the skill runs the checks those measures rest on: which workspace the board belongs to, whether the sources behind each feed are connected, and which company is yours, because that is what separates your accounts from a counterparty's. A check that fails stops and shows you what to fix, rather than drawing a board with holes in it.

## Required data in Well

- **A bank or accounting connector** (required). Every cash, burn, runway, cost and forecast block reads the workspace's own transactions and balances.
- **An invoicing or accounting connector** (recommended). Only a recurring-revenue block needs it; a board without one has no such block to draw.
- **Company profile confirmed in Well** (required). It is what tells your own accounts and invoices from a counterparty's.

## FAQ

**Q: Are these the numbers from when the board was built?**
A: No. Nothing is saved with a board, so every figure you see was measured in the run that drew it. Open the same board next month and it shows next month's figures.

**Q: Why does opening a board take a moment?**
A: Each block is a real measure, run under that measure's own rules. A board with six blocks is six measures, which is the same work as asking for all six one at a time.

**Q: What if a source behind one block is not connected?**
A: The board is not drawn with that block empty. An empty block reads as a figure of zero, which is a different statement from "this could not be measured", so the skill says which source is missing and what to connect.

---

## Installation

The file under `skills/resolve-board/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

### Claude Code

```
/plugin marketplace add WellApp-ai/skills
/plugin install well-skills@wellapp
```

### Codex CLI

```bash
codex plugin marketplace add WellApp-ai/skills
codex plugin add well-skills@wellapp
```

### Claude Desktop

[⬇ Install resolve-board](https://github.com/WellApp-ai/skills/raw/main/dist/resolve-board.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/resolve-board/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "resolve-board". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill resolve-board
```

Whatever the host, the skill needs the Well MCP server at `https://api.wellapp.ai/v1/mcp`. You'll be asked to sign in to Well the first time it needs your data.

---

[← Back to all skills](../README.md#available-skills)

<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="40">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="40">
</p>

<p align="center">
    <sub><b>Well is SOC-2 Type I and GDPR Compliant</b></sub>
</p>

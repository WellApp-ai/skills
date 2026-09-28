<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Compose a board

**The measures you name, arranged on one board that stores the question rather than the answer.**

## What it does

A dashboard usually freezes the day it is built. The numbers on it are the numbers somebody pasted, and a month later nobody can tell which of them still holds.

This skill saves a board as a QUESTION rather than as an answer. Each block carries the feed it draws — your cash position, your average burn, your recurring revenue, your cost structure, your forecast, your cash bridge — and the window it asks that feed for. Nothing on the board is a stored figure, which is what makes a board safe to keep: there is no number on it that can quietly stop being true.

A board answers its own questions when it is opened. `resolve-board` runs each block's feed over each block's window and draws what came back, so the figures on a board are always measured in the run that drew them. This skill is the half that makes a board exist, and once the board is saved it hands over to that one, so the board you just built is drawn with its figures.

The window is what makes a board more than a list of tiles. Two blocks can name the same feed and cover different months, which is how July burn sits beside August burn on one screen and neither one is the other moved. A block about right now names no window at all, because inventing one would store a question you never asked.

Before it writes anything, the skill runs the checks those measures rest on: which workspace the board belongs to, whether the sources behind each feed are connected, and which company is yours, because that is what separates your accounts from a counterparty's. A check that fails stops and shows you what to fix, instead of saving a board whose blocks would all read as unavailable.

## Required data in Well

- **A bank or accounting connector** (required). Every cash, burn, runway, cost and forecast block reads the workspace's own transactions and balances.
- **An invoicing or accounting connector** (recommended). Only a recurring-revenue block needs it; a board without one is saved without that block.
- **Company profile confirmed in Well** (required). It is what tells your own accounts and invoices from a counterparty's.

## FAQ

**Q: Are the numbers saved with the board?**
A: No, and that is deliberate: a stored number is one that can quietly stop being true. The board keeps which feed each block draws and the window it asks for, and drawing it measures every block again, right after the save and every time you open it. The figures you see are always from the run that drew them.

**Q: Can one board show two different months?**
A: Yes. Each block carries its own window, so July burn and August burn are two blocks on the same feed and the board keeps them apart.

**Q: What happens if a source is not connected?**
A: On a new board the skill says so before it writes, and leaves off the blocks that source feeds rather than saving blocks that would read as unavailable. When that leaves nothing to draw, it writes nothing and tells you what to connect. A block already on a board you have is kept either way: the write replaces the whole list, so dropping it would delete it.

---

## Installation

The file under `skills/compose-board/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install compose-board](https://github.com/WellApp-ai/skills/raw/main/dist/compose-board.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/compose-board/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "compose-board". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill compose-board
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

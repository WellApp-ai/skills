<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Build a board from a photo

**Send a dashboard picture, get the same board in Well's own figures.**

## What it does

A photo of somebody's old dashboard, or a screenshot from another tool, is a drawing of an ARRANGEMENT: which measures sat where. It is never a reading. The amounts in the picture are whatever they were the day it was taken, and this skill treats them as unreadable: it names the measures it recognises and throws away every number, date and percentage the image shows.

Naming a measure is a plain-language read: "cash position", "burn", "recurring revenue", not a feed id. Each name is then matched against the same feed table compose-board itself writes blocks from, by exact match. A measure that matches gets a block; a measure that does not is named once, in one line, and left off rather than forced onto the nearest feed, which would draw the wrong number under the right-looking label.

compose-board does the rest: it checks the connections those feeds need, resolves your own company, writes the board once with its source stored as "photo", and hands off to resolve-board, which measures every block fresh and draws it. The board that lands on screen never carries a number this skill read off a picture.

A file that is not a readable dashboard image — a PDF, a spreadsheet, a random upload — gets one line saying so, and an offer to start a board from a template instead. A hand drawing with no measure a person could name builds nothing, and says so in one line, rather than guessing a board into existence from an ambiguous sketch.

## Required data in Well

- **An attached image of a dashboard** (required). A screenshot, a photo of a physical screen, or a hand drawing. A file that is not a readable image gets a plain line and a template offer instead.
- **A bank or accounting connector** (recommended). Needed by whichever measures the image names once they reach compose-board; a measure with no source connected is left off there, not here.

## FAQ

**Q: Does the board store the numbers I see in the photo?**
A: No. The image tells this skill which measures to put on the board and roughly where. Every figure is measured fresh, the same way any other board measures its figures, so the numbers on screen are never the ones in your picture.

**Q: What if a measure in my photo has no equivalent in Well?**
A: It is named once, in one line, and left off the board. Nothing is guessed onto a neighbouring feed, because that would draw the wrong number under the right label.

**Q: Can I send a hand-drawn sketch instead of a screenshot?**
A: Yes, as long as it names at least one measure a person could recognise. A sketch with nothing nameable on it builds no board, and says so.

**Q: What happens if I attach a PDF or a spreadsheet instead of an image?**
A: One line saying it is not a readable dashboard image, with an offer to start a board from a template instead.

---

## Installation

The file under `skills/board-from-photo/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install board-from-photo](https://github.com/WellApp-ai/skills/raw/main/dist/board-from-photo.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/board-from-photo/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "board-from-photo". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill board-from-photo
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

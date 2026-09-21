<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Cost structure

**See where your company's money actually goes, no spreadsheets required.**

## What it does

Ask your AI assistant where the money is going, and it breaks one closed month's outflow down by category, largest first, with each category's share of the total.

The grouping is elected, not assumed. It tries your own chart of accounts first, then Well's category catalog, then the stored labels, then the transaction's own type, and it stops at the first one that actually covers enough of the month to mean something. The answer tells you which one won and how much of the month it covered, so you know whether you are looking at your accountant's categories or a technical fallback.

Each check runs in the open: the connection, whether the syncs finished, whether your accounts are attached to companies you own, whether the month's transactions are categorized. A check that fails stops and shows you what to fix, with the rows and the amount at stake, instead of drawing a chart on top of a gap you would have to notice.

## Required data in Well

- **Accounting connector** (recommended). Supplies the chart of accounts, which is the grouping closest to how your business already thinks about its spend.
- **Banking connector** (required). This is where the real outflows come from.

## FAQ

**Q: Where do the categories come from?**
A: From the first of four columns that covers enough of the month to be worth grouping on: your own chart of accounts, Well's category catalog, the stored category labels, or the transaction type. The answer always says which one it used.

**Q: What if nothing is categorized?**
A: The skill says so, and offers to categorize the month rather than drawing a chart with one unlabelled slice in it.

**Q: Can I change the period?**
A: Yes. Name a month and the breakdown recomputes over it. It is always one closed month, never a quarter.

---

## Installation

The file under `skills/cost-structure/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install cost-structure](https://github.com/WellApp-ai/skills/raw/main/dist/cost-structure.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cost-structure/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "cost-structure". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill cost-structure
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

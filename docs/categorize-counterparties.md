<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Categorize your suppliers

**Close the category gaps behind your spend before you close a month.**

## What it does

A counterparty with no category is a company Well knows the name of and nothing else. This skill reads the counterparties whose invoices a month is still missing — or, asked on its own, every uncategorized counterparty in the workspace — and reports coverage in one line. On a month it says how many of those counterparties carry a category, how many do not, and which uncategorized one carries the most spend. On the workspace-wide ask it says how many counterparties carry no category and that the read lists the first 50 of them; that scope holds no amounts, so it names no biggest company. The card that comes back is where the categorizing happens: it lists the first twelve counterparties and names the rest in a More line, every listed row carries a category select fed by Well's shared catalog, each pick you make saves that company immediately with no submit to press, and its Continue button hands the conversation back when you are done. Categorizing tells Well more about your vendors; it does not change which invoices are missing. The skill makes that one read, points at the card, and stops — it proposes categories only when you ask it to, and then from the rows it already holds plus Well's category catalog, biggest spend first on a month, writing only the ones you confirm. Nothing is ever assigned outside the catalog. It is the categorization step of Well's fetch-missing-invoices flow — it runs after the period is picked and before the flow lists the gaps.

## Required data in Well

- **Banking connector** (required). The spend behind each supplier is what makes the category worth setting.
- **A Well workspace** (required). Categories are saved against the workspace's own counterparties.

## FAQ

**Q: Does it guess the categories?**
A: Only if you ask it to propose them, and never outside Well's catalog. Left alone, it shows you the gaps and you pick.

**Q: Is this the same as categorizing transactions?**
A: No. This is the company behind the spend, not each individual line. One supplier categorized covers all of its transactions.

**Q: When does it matter most?**
A: Before a month-end close or a cost breakdown. An uncategorized supplier is spend that quietly falls outside every category.

---

## Installation

The file under `skills/categorize-counterparties/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/categorize-counterparties/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "categorize-counterparties". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill categorize-counterparties
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

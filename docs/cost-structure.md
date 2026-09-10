<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Cost structure

**See where your company's money actually goes, no spreadsheets required.**

## What it does

Ask your AI assistant where the money is going, and it breaks one month's outflow down by category, largest first, with each category's share of the total. The grouping comes from your own chart of accounts where you have one, and Well's categorization where you don't — and the answer tells you which, so you know what you are looking at.

## Required data in Well

- **Accounting connector** (recommended). Powers the category breakdown from your real ledger. Without it, the skill falls back to estimating from your invoices instead.
- **Invoicing / bills** (required). Needed to show your biggest outstanding bills (accounts payable).
- **Banking connector** (optional). Either a banking or an accounting connector is enough to get started.

## FAQ

**Q: What if no accounting tool is connected?**
A: The skill falls back to estimating categories from your invoices, and tells you that is what it did rather than presenting an estimate as ledger truth.

**Q: Where do the categories come from?**
A: From your own chart of accounts as synced from your accounting tool, so the breakdown matches the categories your accountant already uses.

**Q: Can I change the period?**
A: Yes. Ask for a month, a quarter, or a custom range and the breakdown recomputes over it.

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

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Missing receipts

**Find the bills with no paperwork attached, before an auditor does.**

## What it does

Ask your AI assistant which expenses are missing receipts, and it checks your synced invoices for any that have no source document attached — no receipt or bill PDF on file. You get a list of exactly which invoices need paperwork, with amounts, dates, and currency, straight from your invoicing data. One thing this skill won't do: fetch the missing receipt for you. It only finds the gap — you (or your accounts payable team) still have to go get the document.

## Required data in Well

- **Invoicing / bills connector** (required). This is the primary source: every invoice's attached-document status.
- **Banking or accounting connector** (optional). If present, it enables an additional, secondary check for transactions with no linked document, on top of the main invoice check.

## FAQ

**Q: Can it fetch the receipt for me?**
A: No. It cannot reach into a vendor portal or your inbox. It tells you precisely which documents are missing so the chase is short.

**Q: Does it check transactions too?**
A: Invoices are the primary check. With a bank or accounting tool connected it adds a secondary sweep for transactions with no linked document.

**Q: Why does this matter before an audit?**
A: An expense without a source document is the first thing questioned. Finding the gap early turns an audit finding into a short admin task.

---

## Installation

The file under `skills/missing-receipts/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/missing-receipts/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "missing-receipts". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill missing-receipts
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

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Missing supplier invoices

**See which suppliers owe you paperwork, before your accountant asks.**

## What it does

Ask your AI assistant what you are missing for a month, and it reads Well's gap list for that period: the money that actually left your bank account and still has no supplier invoice behind it, one row per supplier, with the number of transactions and the total. Each row says how the gap can be closed — Well's agent can fetch it from the supplier's portal, the provider needs connecting first, or it needs an upload from you. Amounts that Well has no exchange rate for are shown as unavailable rather than folded into a wrong total, and the list covers your categorized expense transactions, which the skill tells you every time. It is the gap-list step of Well's fetch-missing-invoices flow, after `define-period` — it lists the gaps and hands them on. It never collects the documents itself.

## Required data in Well

- **Banking connector** (required). The settled spend is what proves an invoice is missing in the first place.
- **Accounting or invoicing connector** (recommended). Invoices you already have are matched off, so the list is the real gap rather than everything you spent.

## FAQ

**Q: Does this fetch the invoices?**
A: No. This skill shows you the gap and how each one can be closed. The fetching is a separate step you start yourself.

**Q: Why is it grouped by supplier?**
A: Because you chase a supplier, not a transaction. One row per supplier is the unit of work, with its transactions counted inside.

**Q: What about unpaid customer invoices?**
A: Different question, different skill. This one is about paperwork you are owed by suppliers. For money owed to you, ask for receivables aging.

---

## Installation

The file under `skills/show-missing-invoices/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/show-missing-invoices/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "show-missing-invoices". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill show-missing-invoices
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

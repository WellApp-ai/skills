<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Accounting reports

**Read your profit and loss or balance sheet straight from QuickBooks or Xero.**

## What it does

A founder asks for a profit and loss and expects the same figures their accountant sees. Those figures already exist, inside the accounting tool, built by its own rules. This skill does not rebuild them from transactions. It asks the connected tool for the report itself and states the lines the tool returned: the totals, the top sections, and the period the report covers.

QuickBooks shares its profit and loss, balance sheet, cash flow statement and its aged payables and aged receivables reports. Each comes for the period QuickBooks picks by default, which the answer names plainly. A custom range is not available yet. Xero shares its profit and loss, for the period you name, and its balance sheet. Xero shares no aged, trial balance or cash flow report with Well, and the skill says so plainly. For an aged view on a Xero workspace it answers from Well's own aged invoice reading instead, and it never builds aged bands from a list of Xero invoices. A general ledger or a trial balance is too large to read in a chat answer, so the skill does not read one.

When no accounting tool is connected, the skill offers to connect one. When the connection needs a reconnect, it hands you the reconnect link. A report too large to read in the chat comes back cut; the skill says so, states only the lines that came back whole, and points you to the full report in QuickBooks or Xero.

## Required data in Well

- **QuickBooks or Xero connected** (required). Every figure comes from the report your accounting tool returns. With no accounting tool connected there is no report to read, and the skill offers to connect one.

## FAQ

**Q: Which reports can it read?**
A: From QuickBooks: the profit and loss, the balance sheet, the cash flow statement, and the aged payables and aged receivables reports. From Xero: the profit and loss and the balance sheet. Xero shares no aged, trial balance or cash flow report with Well. A general ledger or a trial balance is too large to read in a chat answer, so the skill does not read one.

**Q: Can I pick the period of a QuickBooks report?**
A: Not yet. A QuickBooks report comes for the period QuickBooks picks by default, and the answer names that period plainly. A Xero profit and loss takes the period you name.

**Q: Does Well recompute the figures?**
A: No. Every figure is stated as your accounting tool returned it. Well adds nothing up, rounds nothing and fills no gap.

**Q: What about an aged receivables report on Xero?**
A: Xero does not share its aged reports with Well. The skill says so, then answers from Well's own aged reading of your synced invoices, which bands each unpaid invoice by how far past due it is.

**Q: What happens with a very large report?**
A: A report too large to read in the chat comes back cut. The skill says so, states only the lines that came back whole, and points you to the full report in QuickBooks or Xero. Only a Xero profit and loss takes a period, so only there does it offer a shorter one.

---

## Installation

The file under `skills/accounting-reports/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install accounting-reports](https://github.com/WellApp-ai/skills/raw/main/dist/accounting-reports.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounting-reports/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "accounting-reports". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill accounting-reports
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

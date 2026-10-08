<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Accounting reports

**Read your profit and loss or balance sheet from QuickBooks, Xero or Pennylane.**

## What it does

A founder asks for a profit and loss and expects the same figures their accountant sees. Those figures already exist, inside the accounting tool, built by its own rules. This skill does not rebuild them from transactions. It asks the connected tool for the report itself and states the lines the tool returned: the totals, the top sections, and the period the report covers.

QuickBooks shares its profit and loss, balance sheet, cash flow statement and its aged payables and aged receivables reports. Each comes for the period QuickBooks picks by default, which the answer names plainly. A custom range is not available yet. Xero shares its profit and loss, for the period you name, and its balance sheet. Xero shares no aged, trial balance or cash flow report with Well, and the skill says so plainly. For an aged view on a Xero or Pennylane workspace it answers from Well's own aged invoice reading instead, and it never builds aged bands from a list of invoices.

Pennylane shares no ready profit and loss or balance sheet, only its trial balance. For Pennylane, Well reads that whole trial balance and computes the profit and loss and the balance sheet itself, by class of the French chart of accounts, for the period you name. The answer says the figures were computed by Well from the Pennylane trial balance. Well builds no balance sheet when it cannot show that the opening balances of the fiscal year are in it, and it says so instead.

When no accounting tool is connected, the skill offers to connect one. When the connection needs a reconnect, it hands you the reconnect link. A report too large to read in the chat comes back cut; the skill says so, states only the lines that came back whole, and points you to the full report in the accounting tool.

## Required data in Well

- **QuickBooks, Xero or Pennylane connected** (required). Every figure comes from your accounting tool: a QuickBooks or Xero report, or the Pennylane trial balance Well computes the statements from. With no accounting tool connected there is nothing to read, and the skill offers to connect one.

## FAQ

**Q: Which reports can it read?**
A: From QuickBooks: the profit and loss, the balance sheet, the cash flow statement, and the aged payables and aged receivables reports. From Xero: the profit and loss and the balance sheet. From Pennylane: the profit and loss and the balance sheet, which Well computes from the Pennylane trial balance. Xero and Pennylane share no aged or cash flow report with Well. A general ledger or a trial balance is too large to read in a chat answer, so the skill does not show one on request. The one exception is a Pennylane refusal that rests on the trial balance: then it shows up to twenty rows, as Pennylane returned them.

**Q: Can I pick the period of a QuickBooks report?**
A: Not yet. A QuickBooks report comes for the period QuickBooks picks by default, and the answer names that period plainly. A Xero or Pennylane profit and loss takes the period you name.

**Q: Does Well recompute the figures?**
A: Not for QuickBooks or Xero: every figure is stated as the tool returned it, and Well adds nothing up, rounds nothing and fills no gap. Pennylane shares only its trial balance, so there Well computes the totals itself, by class of the French chart of accounts, and the answer says so.

**Q: Why does it sometimes refuse a Pennylane balance sheet?**
A: A balance sheet needs the opening balances of the fiscal year. Well builds one only when it can show those balances are in the Pennylane trial balance, usually once the previous year is closed in Pennylane. Otherwise it says so and gives the profit and loss alone. A balance sheet, or a profit and loss, that ends on the last day of a closed fiscal year can also be refused: when Pennylane seems to have booked the year-end closing entries on that day, Well cannot prove the figures and gives none. It also builds no statement for a workspace whose base currency is not the euro.

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

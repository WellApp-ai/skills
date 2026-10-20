<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Secure Payroll

**Know if payroll is safe, and which vendor bills to push if it is not.**

## What it does

You give the payroll amount and date. Well sets your bank balance, the customer invoices due before then and the vendor bills due before it against the payroll.

If payroll is short, Well proposes which bills to push, latest due first so each one slips the fewest days, and shows the largest-first list beside it. You choose. Each pushed bill gets a new date, the days it runs late and any late fee written on the bill, or a note that none is on record. Every figure is computed by Well to the cent.

Well never counts an overdue customer invoice as sure cash, adds amounts in different currencies or turns an unknown balance into zero. A bill in another currency is listed to check, with no figure. If some bills or invoices may be missing from the figures, or pushing every bill still leaves payroll short, it says so.

## Required data in Well

- **Bank account** (required). The cash balance starts from your real bank balance.
- **Your company** (required). Well needs your company to tell bills you owe from invoices you are owed.
- **Invoices and bills** (optional). Customer invoices and vendor bills give the receipts and bills due.

## FAQ

**Q: Does it pay or delay a bill for me?**
A: No. It only reads your data and proposes which bills to push. You choose.

**Q: Does it count a late customer payment as cash?**
A: No. An overdue invoice is named as late and left out of countable cash.

---

## Installation

The file under `skills/secure-payroll/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install secure-payroll](https://github.com/WellApp-ai/skills/raw/main/dist/secure-payroll.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/secure-payroll/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "secure-payroll". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill secure-payroll
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

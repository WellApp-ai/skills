<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Optimize Supplier Prices

**See what you paid a supplier, how its price moved, and get the negotiation email drafted.**

## What it does

A supplier renewal is easier when you know what you have paid so far. This skill finds the supplier in your workspace, reads every payment to it from your bank feed, and gives the total, the number of payments and the direction of the price. Amounts in different currencies stay apart and are never added together.

Give it a new quote, typed or attached, and it sets that figure against what you paid before, with a plain verdict. Ask for an email and it writes a short draft in your language that cites the history and asks for a fair price. When the supplier has invoices, their unit prices by date sharpen the trend.

It stops and says so when it cannot read a trustworthy history. A missing bank account, an unset company profile or a name that fits two suppliers each get one plain line, never a guessed figure. A bank sync that is still running is named at the top of the answer, because the history may be incomplete.

## Required data in Well

- **Bank account** (required). The payments to the supplier come from your bank feed.
- **Company profile** (required). Well needs to know which company is yours to tell what you paid from what you received.
- **Invoices** (optional). Supplier invoices add the unit price by date to the price trend.

## FAQ

**Q: Does it send the email to the supplier?**
A: No. It prepares a draft that you review and send yourself from your own email app. Well never sends it.

**Q: Where do the figures come from?**
A: From the payments in your connected bank accounts and, when you have them, your supplier invoices. Each currency is reported on its own and never converted.

**Q: What if I only have a new quote and no history?**
A: Well says that no payments to that supplier were found and gives no verdict. It will not judge a quote against figures it does not have.

---

## Installation

The file under `skills/optimize-supplier-prices/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install optimize-supplier-prices](https://github.com/WellApp-ai/skills/raw/main/dist/optimize-supplier-prices.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/optimize-supplier-prices/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "optimize-supplier-prices". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill optimize-supplier-prices
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

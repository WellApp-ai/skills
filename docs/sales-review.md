<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Sales review

**Get your month in sales on one screen: deals won and lost, your biggest customers and who pays late.**

## What it does

Deals come from Well, counted by the day they closed, and from a connected Pipedrive, read live and counted by the day each was won or lost. Well stores no lost reason, so the review says it is not recorded; a Pipedrive deal shows its own. Customers are ranked on invoices you issued, before tax, each currency apart. Late payers come from your unpaid invoices past their due date.

It only reads: it changes nothing in Well or your CRM and sends nothing.

## Required data in Well

- **Invoicing tool** (recommended). Issued invoices rank your largest customers, and unpaid ones give the late payers.

## FAQ

**Q: Does it read the deals of my CRM?**
A: It reads Well's deals by the day they closed, and Pipedrive live by the day each deal was won or lost. Attio gives no won or lost date, so its deals are named as not dated and not counted.

**Q: Why does a lost deal show no reason?**
A: Well does not store why a deal was lost, so the review says the reason is not recorded rather than guess one. A Pipedrive deal shows the reason filled in Pipedrive.

**Q: What if the month is not over?**
A: The reply opens on a provisional line with the date of the read, and every figure covers the month so far.

---

## Installation

The file under `skills/sales-review/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install sales-review](https://github.com/WellApp-ai/skills/raw/main/dist/sales-review.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/sales-review/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "sales-review". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill sales-review
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

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Customer Dependency

**See how much of your revenue rides on a few customers, and what a late or lost one does to your cash.**

## What it does

Customer concentration is the share of your income that rides on a few customers. This skill measures it from your own invoices: the share of the biggest customer, the combined share of the top three, and how much of your unpaid invoices sit with the biggest one.

If the biggest customer pays 30 days late, the money it owes you arrives a month later. If it leaves, its yearly revenue stops. Both cases come as amounts. It reads invoices only, not your bank balance.

## Required data in Well

- **Invoicing tool** (required). The invoices you issued are the source of revenue and unpaid amounts per customer.

## FAQ

**Q: Does it tell me how long my cash lasts without my biggest customer?**
A: No. It reads invoices, not your bank balance. It gives the money that arrives late or stops, and you can ask for your runway next.

**Q: What if my invoices are still syncing?**
A: The reply marks every figure as provisional, gives the date of the last finished sync and names the tool still updating.

---

## Installation

The file under `skills/customer-dependency/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install customer-dependency](https://github.com/WellApp-ai/skills/raw/main/dist/customer-dependency.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/customer-dependency/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "customer-dependency". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill customer-dependency
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

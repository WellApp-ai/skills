<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Runway Stress Test

**See how long your cash lasts if a customer pays late, leaves, or you hire.**

## What it does

A static cash divided by burn figure hides the risks that decide a raise or a hire. This skill reads your cash on hand and your net burn, then tests the runway against what-ifs you name. It delays one customer's open invoices, removes one customer's monthly income, or adds the cost of a hire. Each result sits beside the base case with the cause of the change. The hire cost comes from you, since Well does not hold future payroll. A customer you name must exist in your invoices. When your bank data is old, the answer says how old.

## Required data in Well

- **Bank account** (required). Cash on hand and the monthly burn come from the bank feed.
- **Own company** (required). Tells your sales from your purchases, so customers and burn are right.
- **Invoicing or accounting tool** (recommended). Names your biggest customer and the invoices they still owe.

## FAQ

**Q: What is the base case?**
A: Your cash on hand divided by your net burn, which is what you spend minus what comes in each month.

**Q: Where does the hire cost come from?**
A: From you. Tell me the head count and the monthly cost of each person.

**Q: Does it change anything in my accounts?**
A: No. It only reads your data and does the arithmetic.

---

## Installation

The file under `skills/runway-stress-test/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install runway-stress-test](https://github.com/WellApp-ai/skills/raw/main/dist/runway-stress-test.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/runway-stress-test/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "runway-stress-test". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill runway-stress-test
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
